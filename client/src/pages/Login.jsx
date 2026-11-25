// Login / register page with inline validation and demo account.
import { useState } from 'react';
import { Eye, EyeOff, Loader2, Users } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { errorInfo } from '../api.js';

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const validate = () => {
    const e = {};
    if (isRegister && form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (isRegister && !(form.password.length >= 8 && /[A-Za-z]/.test(form.password) && /\d/.test(form.password)))
      e.password = 'Min 8 characters with a letter and a number';
    if (!isRegister && !form.password) e.password = 'Password is required';
    return e;
  };

  const submit = async (e, creds) => {
    e?.preventDefault();
    const body = creds || form;
    const v = creds ? {} : validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      if (isRegister && !creds) await register(body); else await login({ email: body.email, password: body.password });
    } catch (err) {
      const { message, fields } = errorInfo(err);
      setErrors(Object.keys(fields).length ? fields : { form: message });
    } finally { setBusy(false); }
  };

  const Field = ({ id, label, type = 'text', children }) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      <div className="relative">
        <input id={id} type={type} className="input" value={form[id]} onChange={set(id)} autoComplete={id} />
        {children}
      </div>
      {errors[id] && <p className="mt-1 text-xs text-red-600">{errors[id]}</p>}
    </div>
  );

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-2 text-indigo-600"><Users /><span className="text-xl font-bold">LeadFlow</span></div>
        <h1 className="mb-1 text-2xl font-semibold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mb-6 text-sm text-slate-500">{isRegister ? 'Start tracking leads in minutes.' : 'Sign in to manage your leads.'}</p>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {isRegister && Field({ id: 'name', label: 'Full name' })}
          {Field({ id: 'email', label: 'Email', type: 'email' })}
          {Field({ id: 'password', label: 'Password', type: show ? 'text' : 'password', children: (
            <button type="button" aria-label="Toggle password visibility" onClick={() => setShow(!show)}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>) })}
          {errors.form && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{errors.form}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" size={16} />}{isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        <button className="btn-ghost mt-3 w-full" disabled={busy} onClick={() => submit(null, { email: 'demo@leadflow.com', password: 'Demo@1234' })}>Use demo account</button>
        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <button className="font-medium text-indigo-600 hover:underline" onClick={() => { setIsRegister(!isRegister); setErrors({}); }}>
            {isRegister ? 'Sign in' : 'Create an account'}</button>
        </p>
      </div>
    </main>
  );
}
