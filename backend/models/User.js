import bcrypt from 'bcryptjs';
import { db } from '../firebaseAdmin.js';

const COLLECTION = 'users';

function serialize(userDoc) {
  if (!userDoc) return null;
  const data = userDoc.data();
  return { _id: userDoc.id, ...data };
}

class UserModel {
  static async findOne(query) {
    let q = db.collection(COLLECTION);
    Object.entries(query).forEach(([k, v]) => {
      q = q.where(k, '==', v);
    });
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const user = serialize(doc);
    user.toJSON = () => {
      const { password, ...rest } = user;
      return rest;
    };
    user.comparePassword = async (candidate) => {
      if (!user.password) return false;
      return bcrypt.compare(candidate, user.password);
    };
    return user;
  }

  static async findById(id) {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    const user = serialize(doc);
    user.toJSON = () => {
      const { password, ...rest } = user;
      return rest;
    };
    user.comparePassword = async (candidate) => {
      if (!user.password) return false;
      return bcrypt.compare(candidate, user.password);
    };
    return user;
  }

  static async find(query) {
    let q = db.collection(COLLECTION);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        q = q.where(k, '==', v);
      });
    }
    const snap = await q.get();
    return snap.docs.map((d) => {
      const user = serialize(d);
      user.toJSON = () => {
        const { password, ...rest } = user;
        return rest;
      };
      return user;
    });
  }

  static async findByIdAndDelete(id) {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    const user = serialize(doc);
    await db.collection(COLLECTION).doc(id).delete();
    return user;
  }

  static async updateById(id, partial) {
    const data = { ...partial };
    if (data.password && !data.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(7);
      data.password = await bcrypt.hash(data.password, salt);
    }
    data.updatedAt = new Date();
    await db.collection(COLLECTION).doc(id).set(data, { merge: true });
    return await this.findById(id);
  }

  constructor(data) {
    this.data = {
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      authProvider: 'local',
      consentStatus: 'pending',
      consentGiven: false,
      consentText: '',
      consentSubmittedAt: null,
      consentReviewedBy: null,
      consentReviewedAt: null,
      // removed 2FA fields
     
      // removed this. Email change tracking for superadmin 2FA requirements
     
      ...data,
    };
  }

  async save() {
    const data = { ...this.data };
    if (data.password && !data.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(7);
      data.password = await bcrypt.hash(data.password, salt);
    }
    data.updatedAt = new Date();

    if (this.data._id) {
      await db.collection(COLLECTION).doc(this.data._id).set(data, { merge: true });
      return this;
    } else {
      const docRef = await db.collection(COLLECTION).add(data);
      this.data._id = docRef.id;
      return this;
    }
  }

  toJSON() {
    const { password, ...rest } = this.data;
    return rest;
  }
}

export default UserModel;
