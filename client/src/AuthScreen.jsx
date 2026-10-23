import { useState } from 'react';

const AUTH_API = 'http://localhost:5000/api/auth';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (isSignup && name.trim().length < 2) return setError('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Your password needs at least 8 characters.');

    try {
      setBusy(true);
      const response = await fetch(`${AUTH_API}/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not sign you in. Please try again.');
      onAuthenticated(result);
    } catch (requestError) {
      setError(requestError.message || 'Could not reach CourseMate. Check that the server is running.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-topline"><a className="auth-brand" href="#home"><span className="auth-brand-mark">✳</span> course<span>mate</span></a><span className="auth-top-note">A clearer way to get through the semester.</span></div>
      <div className="auth-layout">
        <section className="auth-story">
          <p className="auth-kicker"><span /> YOUR STUDENT SPACE</p>
          <h1>Make time<br />for <em>what matters.</em></h1>
          <p className="auth-intro">Bring deadlines, coursework and your next big idea into one calm, considered space.</p>
          <div className="art-stage" aria-label="A 3D illustration of a student's coursework planner">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="art-sun" />
            <div className="art-sheet sheet-back"><span>WEEK 08</span><i /><i /><i /></div>
            <div className="art-sheet sheet-front"><div className="art-sheet-head"><span>YOUR WEEK</span><b>03 / 05</b></div><div className="art-line done-line"><span>✓</span><i /><b /></div><div className="art-line"><span /><i /><b /></div><div className="art-line"><span /><i /><b /></div><div className="art-progress"><span /></div></div>
            <div className="art-floating-note"><span>✦</span><div><b>Small steps.</b><small>Add up to big progress.</small></div></div>
            <div className="art-stamp">PLAN<br />WITH<br />PURPOSE</div>
          </div>
          <div className="auth-proof"><span className="proof-stars">✳</span><p>“A little more clarity. A lot less deadline stress.”</p><span>MADE FOR THE WAY YOU STUDY</span></div>
        </section>

        <section className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-card-heading"><span className="auth-card-mark">✳</span><p className="auth-card-eyebrow">WELCOME TO COURSEMATE</p><h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2><p>{isSignup ? 'A little structure can change your whole semester.' : 'Pick up where you left off.'}</p></div>
            <div className="auth-mode-switch" role="tablist" aria-label="Account access"><button type="button" role="tab" aria-selected={!isSignup} className={!isSignup ? 'chosen' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button><button type="button" role="tab" aria-selected={isSignup} className={isSignup ? 'chosen' : ''} onClick={() => { setMode('signup'); setError(''); }}>Create account</button></div>
            <form className="auth-form" onSubmit={handleSubmit}>
              {isSignup && <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" maxLength={60} required /></label>}
              <label>Student email<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@college.edu" required /></label>
              <label>Password<div className="password-wrap"><input autoComplete={isSignup ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'} minLength={8} maxLength={128} required /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
              {error && <div className="auth-error" role="alert"><span>!</span>{error}</div>}
              <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'One moment…' : isSignup ? 'Create my account' : 'Sign in to CourseMate'}<span>→</span></button>
            </form>
            <p className="auth-switch-copy">{isSignup ? 'Already have an account?' : 'New to CourseMate?'} <button type="button" onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); }}>{isSignup ? 'Sign in' : 'Create your account'}</button></p>
            <p className="auth-privacy"><span>◈</span> Your coursework stays in your own student account.</p>
          </div>
          <span className="auth-card-caption">LESS CHAOS. MORE MOMENTUM.</span>
        </section>
      </div>
      <footer className="auth-footer"><span>© CourseMate Student Workspace</span><span>Plan well. Learn deeply. Keep going.</span></footer>
    </main>
  );
}
