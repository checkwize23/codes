import express from 'express';
import { db } from '../firebaseAdmin.js';
import { authenticateToken, requireSuperAdmin, requireAdmin, canAccessUser } from '../middleware/auth.js';
import { getStorage } from 'firebase-admin/storage';
import UserModel from '../models/User.js';
import { Resend } from 'resend';


const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

// Delete service request and associated documents
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the service request document first to extract document URLs
    const serviceRequestRef = db.collection('serviceRequests').doc(id);
    const serviceRequestDoc = await serviceRequestRef.get();
    
    if (!serviceRequestDoc.exists) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    const serviceRequestData = serviceRequestDoc.data();
    
    // Extract all document URLs from the service request
    const documentUrls = [];
    Object.entries(serviceRequestData).forEach(([key, value]) => {
      // Skip metadata fields
      if (['userId', 'status', 'serviceKey', 'createdAt', 'reviewedAt', 'reviewedBy', 'notes', 'remarks'].includes(key)) {
        return;
      }
      
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'string' && (item.startsWith('http') || item.includes('firebasestorage'))) {
            documentUrls.push(item);
          }
        });
      } else if (typeof value === 'string' && (value.startsWith('http') || value.includes('firebasestorage'))) {
        documentUrls.push(value);
      }
    });
    
    // Delete documents from Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    
    for (const url of documentUrls) {
      try {
        // Extract file path from URL
        let filePath;
        if (url.includes('firebasestorage.googleapis.com')) {
          // Parse URL like: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?alt=media&token=...
          const urlParts = url.split('/o/');
          if (urlParts.length > 1) {
            const pathPart = urlParts[1].split('?')[0];
            filePath = decodeURIComponent(pathPart);
          }
        } else if (url.includes('gs://')) {
          // Parse gs://bucket/path/to/file
          const urlParts = url.split('/');
          filePath = urlParts.slice(3).join('/');
        }
        
        if (filePath) {
          const file = bucket.file(filePath);
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            console.log(`Deleted file: ${filePath}`);
          }
        }
      } catch (fileError) {
        console.error(`Error deleting file ${url}:`, fileError);
        // Continue with other files even if one fails
      }
    }
    
    // Delete the service request document from Firestore
    await serviceRequestRef.delete();
    
    res.json({ 
      message: 'Service request and associated documents deleted successfully',
      deletedDocuments: documentUrls.length
    });
    
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// consent routes
//user submits conent
router.post('/consent/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { consentText } = req.body;

    const updatedUser = await UserModel.updateById(userId, {
      consentGiven: true,
      consentText,
      consentStatus: 'pending',
      consentSubmittedAt: new Date(),
    });

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//admin approves/rejects consent
router.post('/consent/review', authenticateToken, requireAdmin, async (req, res) => {
  try{
    const adminId = req.user._id;
    const { userId, status } = req.body;

    if(!['approved', 'rejected'].includes(status)){
    return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedUser = await UserModel.updateById(userId, {
      consentStatus: status,
      consentReviewedBy: adminId,
      consentReviewedAt: new Date(),
    });

    res.json({ success: true, user:updatedUser});
  } catch (err) {
    res.status(500).json({error: err.message });
  }
});

//get consent status
router.get('/consent/status/:userId', authenticateToken, canAccessUser, async(req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);

    res.json({
      consentStatus: user.consentStatus,
      consentGiven: user.consentGiven,
      consentSubmittedAt: user.consentSubmittedAt,
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Contact form email route

router.post('/contact/send-email', async(req, res)=> {
  try{
    const{
      name,
      email,
      phone,
      message,
      companyInfo
    } = req.body;

    await resend.emails.send({
      from: 'Checkwize <onboarding@resend.dev>',
      to: 'checkwize29@gmail.com',
      subject: `New Contact Message from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <h3>Message</h3>
        <p>${message}</p>
        <h3>Company Information</h3>
        <p><strong>Company Name:</strong> ${companyInfo?.companyName || 'N/A'}</p>
        <p><strong>Company Phone:</strong> ${companyInfo?.companyPhone || 'N/A'}</p>
        <p><strong>Company Email:</strong> ${companyInfo?.companyEmail || 'N/A'}</p>
        <p><strong>Company Address:</strong> ${companyInfo?.companyAddress || 'N/A'}</p>
      `,
    });
    
    res.status(200).json({
      success:true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
    });
  }
});

export default router;
