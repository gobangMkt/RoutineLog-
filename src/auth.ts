import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from 'firebase/auth'
import { doc, deleteDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 11)
}

function toEmail(phone: string): string {
  return `${normalizePhone(phone)}@routinelog.app`
}

export async function phoneExists(phone: string): Promise<boolean> {
  const methods = await fetchSignInMethodsForEmail(auth, toEmail(phone))
  return methods.length > 0
}

export async function register(phone: string, password: string): Promise<void> {
  const email = toEmail(phone)
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  sessionStorage.setItem('rl_phone', normalizePhone(phone))
  sessionStorage.setItem('rl_uid', cred.user.uid)
}

export async function login(phone: string, password: string): Promise<void> {
  const cred = await signInWithEmailAndPassword(auth, toEmail(phone), password)
  sessionStorage.setItem('rl_phone', normalizePhone(phone))
  sessionStorage.setItem('rl_uid', cred.user.uid)
}

export async function resetUser(phone: string, password: string): Promise<void> {
  const email = toEmail(phone)
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const user = cred.user

  const credential = EmailAuthProvider.credential(email, password)
  await reauthenticateWithCredential(user, credential)

  const dataKeys = ['parents', 'subs', 'memos', 'templates', 'meta', 'settings']
  await Promise.all(
    dataKeys.map(k => deleteDoc(doc(db, 'users', user.uid, 'data', k)).catch(() => {}))
  )
  await deleteUser(user)
}

export function getSession(): { phone: string; uid: string } | null {
  const phone = sessionStorage.getItem('rl_phone')
  const uid = sessionStorage.getItem('rl_uid')
  if (!phone || !uid) return null
  return { phone, uid }
}

export async function clearSession(): Promise<void> {
  sessionStorage.removeItem('rl_phone')
  sessionStorage.removeItem('rl_uid')
  await signOut(auth).catch(() => {})
}
