import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 11)
}

function toEmail(phone: string): string {
  return `${normalizePhone(phone)}@routinelog.app`
}

// Firestore phones/{normalized} 로 존재 여부 확인 (fetchSignInMethodsForEmail 대체)
export async function phoneExists(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone)
  const snap = await getDoc(doc(db, 'phones', normalized))
  return snap.exists()
}

export async function register(phone: string, password: string): Promise<void> {
  const normalized = normalizePhone(phone)
  const email = toEmail(phone)
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  // phones 컬렉션에 등록 기록 (phoneExists용)
  await setDoc(doc(db, 'phones', normalized), {
    uid: cred.user.uid,
    createdAt: new Date().toISOString(),
  })
  sessionStorage.setItem('rl_phone', normalized)
  sessionStorage.setItem('rl_uid', cred.user.uid)
}

export async function login(phone: string, password: string): Promise<void> {
  const cred = await signInWithEmailAndPassword(auth, toEmail(phone), password)
  sessionStorage.setItem('rl_phone', normalizePhone(phone))
  sessionStorage.setItem('rl_uid', cred.user.uid)
}

export async function resetUser(phone: string, password: string): Promise<void> {
  const normalized = normalizePhone(phone)
  const email = toEmail(phone)
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const user = cred.user

  const credential = EmailAuthProvider.credential(email, password)
  await reauthenticateWithCredential(user, credential)

  // Firestore 데이터 삭제
  const dataKeys = ['parents', 'subs', 'memos', 'templates', 'meta', 'settings']
  await Promise.all(
    dataKeys.map(k => deleteDoc(doc(db, 'users', user.uid, 'data', k)).catch(() => {}))
  )
  // phones 레코드 삭제
  await deleteDoc(doc(db, 'phones', normalized)).catch(() => {})
  // Auth 계정 삭제
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
