import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';

export const sendNotification = async ({ recipientId, recipientEmail, recipientRole, title, message, sentBy, sentByRole }) => {
  await addDoc(collection(db, 'notifications'), {
    recipientId,
    recipientEmail,
    recipientRole,
    title,
    message,
    sentBy,
    sentByRole,
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const markAsRead = async (notifId) => {
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
};

export const subscribeToNotifications = (recipientId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', recipientId),
    where('read', '==', false)
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => {
      const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return tb - ta;
    });
    callback(items);
  });
};