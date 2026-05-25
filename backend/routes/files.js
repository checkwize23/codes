import express from 'express'
import { admin } from '../firebaseAdmin.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Generate a time-limited signed URL for a storage object
// Body: { path: string } where path is the storage object path like "users/{uid}/.../file.pdf"
router.post('/signed-url', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let { path, url, gsUri } = req.body || {}

    // Accept either raw storage object path, a full download URL, or a gs:// URI
    if ((!path || typeof path !== 'string') && typeof url === 'string' && url.startsWith('http')) {
      try {
        const parsed = new URL(url)
        // Expect /v0/b/<bucket>/o/<encodedPath>?...
        const idx = parsed.pathname.indexOf('/o/')
        if (idx >= 0) {
          const encoded = parsed.pathname.substring(idx + 3) // after '/o/'
          const withoutQuery = encoded.split('?')[0]
          path = decodeURIComponent(withoutQuery)
        }
      } catch {}
    }
    if ((!path || typeof path !== 'string') && typeof gsUri === 'string' && gsUri.startsWith('gs://')) {
      // gs://bucket/dir/file -> path after bucket/
      const parts = gsUri.replace('gs://', '').split('/')
      parts.shift() // remove bucket
      path = parts.join('/')
    }
    if (typeof path === 'string') {
      path = path.trim()
      if (path.startsWith('/')) path = path.slice(1)
    }
    if (!path || typeof path !== 'string' || !path.trim()) {
      return res.status(400).json({ message: 'path is required' })
    }

    const bucket = admin.storage().bucket()
    const file = bucket.file(path)

    const [exists] = await file.exists()
    if (!exists) {
      return res.status(404).json({ message: 'File not found' })
    }

    const expires = Date.now() + 15 * 60 * 1000 // 15 minutes
    const [signedUrl] = await file.getSignedUrl({ action: 'read', expires })
    return res.json({ url: signedUrl, expires })
  } catch (err) {
    console.error('Signed URL error:', err)
    return res.status(500).json({ message: 'Failed to generate signed URL' })
  }
})

export default router;


