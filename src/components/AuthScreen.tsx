import { useState } from 'react'
import { ChevronRight, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { phoneExists, login, register, resetUser, normalizePhone } from '../auth'

interface Props {
  onLogin: (session: { phone: string; uid: string }) => void
}

type Step = 'phone' | 'login' | 'register' | 'reset'

function formatPhoneDisplay(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

export default function AuthScreen({ onLogin }: Props) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [resetPw, setResetPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePhoneNext = async () => {
    const normalized = normalizePhone(phone)
    if (normalized.length < 10) { setError('올바른 휴대폰 번호를 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      const exists = await phoneExists(phone)
      if (exists) setStep('login')
      else setStep('register')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!password) { setError('비밀번호를 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      await login(phone, password)
      const normalized = normalizePhone(phone)
      const uid = sessionStorage.getItem('rl_uid')!
      onLogin({ phone: normalized, uid })
    } catch (e) {
      setError((e as Error).message === 'Firebase: Error (auth/invalid-credential).'
        ? '비밀번호가 틀렸습니다.'
        : (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    if (password !== confirmPw) { setError('비밀번호가 일치하지 않습니다.'); return }
    setLoading(true); setError('')
    try {
      await register(phone, password)
      const normalized = normalizePhone(phone)
      const uid = sessionStorage.getItem('rl_uid')!
      onLogin({ phone: normalized, uid })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!resetPw) { setError('현재 비밀번호를 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      await resetUser(phone, resetPw)
      setPassword(''); setConfirmPw(''); setResetPw(''); setError('')
      setStep('register')
    } catch (e) {
      const msg = (e as Error).message
      setError(msg.includes('invalid-credential') ? '비밀번호가 틀렸습니다.' : '초기화 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const back = () => {
    setPassword(''); setConfirmPw(''); setResetPw(''); setError('')
    setStep('phone')
  }

  return (
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-teal-light flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h1 className="text-[24px] font-bold text-text-dark">루틴로그</h1>
          <p className="text-[14px] text-text-gray mt-1">매일의 루틴을 기록하세요</p>
        </div>

        {/* Phone step */}
        {step === 'phone' && (
          <div className="bg-surface rounded-[12px] p-6">
            <h2 className="text-[18px] font-bold text-text-dark mb-1">시작하기</h2>
            <p className="text-[14px] text-text-gray mb-5">휴대폰 번호를 입력해주세요</p>

            <label className="block text-[14px] font-semibold text-text-dark mb-2">휴대폰 번호</label>
            <input
              autoFocus
              inputMode="tel"
              value={formatPhoneDisplay(phone)}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              onKeyDown={e => e.key === 'Enter' && handlePhoneNext()}
              placeholder="010-0000-0000"
              className="w-full px-4 py-[14px] border-[1.5px] border-border-def focus:border-teal rounded-[10px] text-[15px] text-text-dark outline-none transition-colors tracking-wider placeholder:text-text-muted"
            />
            {error && <p className="text-[12px] text-error mt-2">{error}</p>}

            <button
              onClick={handlePhoneNext}
              disabled={loading}
              className="w-full mt-5 py-[15px] rounded-[10px] bg-teal text-white font-bold text-[16px] flex items-center justify-center gap-1 hover:bg-teal-hover disabled:bg-disabled-bg disabled:text-text-muted transition-colors"
            >
              {loading ? '확인 중...' : <><span>다음</span> <ChevronRight size={18} /></>}
            </button>
          </div>
        )}

        {/* Login step */}
        {step === 'login' && (
          <div className="bg-surface rounded-[12px] p-6">
            <button onClick={back} className="text-[13px] text-text-gray mb-4 hover:text-text-dark">
              ← {formatPhoneDisplay(phone)}
            </button>
            <h2 className="text-[18px] font-bold text-text-dark mb-1">반가워요!</h2>
            <p className="text-[14px] text-text-gray mb-5">비밀번호를 입력해주세요</p>

            <label className="block text-[14px] font-semibold text-text-dark mb-2">비밀번호</label>
            <div className="relative">
              <input
                autoFocus
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="비밀번호 입력"
                className="w-full px-4 py-[14px] border-[1.5px] border-border-def focus:border-teal rounded-[10px] text-[15px] text-text-dark outline-none transition-colors pr-12 placeholder:text-text-muted"
              />
              <button
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-gray"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-[12px] text-error mt-2">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-5 py-[15px] rounded-[10px] bg-teal text-white font-bold text-[16px] disabled:bg-disabled-bg disabled:text-text-muted hover:bg-teal-hover transition-colors"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <button
              onClick={() => setStep('reset')}
              className="w-full mt-3 text-[14px] text-text-gray hover:text-text-dark transition-colors py-1"
            >
              비밀번호를 잊으셨나요?
            </button>
          </div>
        )}

        {/* Register step */}
        {step === 'register' && (
          <div className="bg-surface rounded-[12px] p-6">
            <button onClick={back} className="text-[13px] text-text-gray mb-4 hover:text-text-dark">
              ← {formatPhoneDisplay(phone)}
            </button>
            <h2 className="text-[18px] font-bold text-text-dark mb-1">처음이시군요!</h2>
            <p className="text-[14px] text-text-gray mb-5">사용할 비밀번호를 설정해주세요</p>

            <label className="block text-[14px] font-semibold text-text-dark mb-2">비밀번호 (6자 이상)</label>
            <div className="relative mb-4">
              <input
                autoFocus
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full px-4 py-[14px] border-[1.5px] border-border-def focus:border-teal rounded-[10px] text-[15px] text-text-dark outline-none transition-colors pr-12 placeholder:text-text-muted"
              />
              <button
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-gray"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label className="block text-[14px] font-semibold text-text-dark mb-2">비밀번호 확인</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              placeholder="비밀번호 재입력"
              className="w-full px-4 py-[14px] border-[1.5px] border-border-def focus:border-teal rounded-[10px] text-[15px] text-text-dark outline-none transition-colors placeholder:text-text-muted"
            />
            {error && <p className="text-[12px] text-error mt-2">{error}</p>}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full mt-5 py-[15px] rounded-[10px] bg-teal text-white font-bold text-[16px] disabled:bg-disabled-bg disabled:text-text-muted hover:bg-teal-hover transition-colors"
            >
              {loading ? '처리 중...' : '시작하기'}
            </button>
          </div>
        )}

        {/* Reset step */}
        {step === 'reset' && (
          <div className="bg-surface rounded-[12px] p-6 border-[1.5px] border-error-bg">
            <button onClick={() => setStep('login')} className="text-[13px] text-text-gray mb-4 hover:text-text-dark">
              ← 돌아가기
            </button>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={20} className="text-error" />
              <h2 className="text-[18px] font-bold text-error">전체 초기화</h2>
            </div>
            <p className="text-[14px] text-text-body mb-2">
              <span className="font-semibold">{formatPhoneDisplay(phone)}</span> 계정의
            </p>
            <p className="text-[14px] text-text-body mb-5">
              모든 투두, 메모, 템플릿 데이터가{' '}
              <span className="font-semibold text-error">영구 삭제</span>됩니다.
              <br />비밀번호를 새로 설정할 수 있습니다.
            </p>
            <div className="bg-error-bg border border-error rounded-[10px] px-4 py-3 mb-5">
              <p className="text-[13px] text-error">⚠️ 이 작업은 되돌릴 수 없습니다.</p>
            </div>

            <label className="block text-[14px] font-semibold text-text-dark mb-2">현재 비밀번호 확인</label>
            <div className="relative mb-5">
              <input
                type={showPw ? 'text' : 'password'}
                value={resetPw}
                onChange={e => setResetPw(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                placeholder="현재 비밀번호 입력"
                className="w-full px-4 py-[14px] border-[1.5px] border-border-def focus:border-teal rounded-[10px] text-[15px] text-text-dark outline-none transition-colors pr-12 placeholder:text-text-muted"
              />
              <button
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-gray"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-[12px] text-error mb-3">{error}</p>}

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-[15px] rounded-[10px] bg-error text-white font-bold text-[16px] hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? '처리 중...' : '전체 초기화 후 새로 시작'}
            </button>
            <button
              onClick={() => setStep('login')}
              className="w-full mt-3 py-[15px] rounded-[10px] bg-cancel-bg text-cancel-text font-semibold text-[16px]"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
