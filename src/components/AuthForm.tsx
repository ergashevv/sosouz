'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { countries } from '@/lib/countries';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { AsYouType, CountryCode, getCountryCallingCode, parsePhoneNumberFromString, validatePhoneNumberLength } from 'libphonenumber-js';
import ReactCountryFlag from 'react-country-flag';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') || '/chat';
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('UZ');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneLengthError, setPhoneLengthError] = useState<string | null>(null);

  const isSignup = mode === 'signup';
  const countryOptions = useMemo(() => {
    return countries
      .map((country) => {
        try {
          return {
            code: country.code,
            dialCode: `+${getCountryCallingCode(country.code as CountryCode)}`,
          };
        } catch {
          return null;
        }
      })
      .filter((country): country is { code: string; dialCode: string } => Boolean(country));
  }, []);

  const activeCountry = countryOptions.find((country) => country.code === countryCode) || countryOptions[0];
  const activeDialCode = activeCountry?.dialCode || '+998';

  const trimTooLongNationalDigits = (digits: string, targetCountry: string, dialCode: string) => {
    let result = digits;
    while (result) {
      const status = validatePhoneNumberLength(`${dialCode}${result}`, targetCountry as CountryCode);
      if (status !== 'TOO_LONG') break;
      result = result.slice(0, -1);
    }
    return result;
  };

  const formatNationalNumber = (digits: string, targetCountry: string) => {
    return new AsYouType(targetCountry as CountryCode).input(digits);
  };

  useEffect(() => {
    if (!countryMenuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!countryDropdownRef.current?.contains(event.target as Node)) {
        setCountryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [countryMenuOpen]);

  const handleCountrySelect = (nextCode: string) => {
    setCountryCode(nextCode);
    setCountryMenuOpen(false);
    setPhoneLengthError(null);

    const nextDialCode = countryOptions.find((country) => country.code === nextCode)?.dialCode;
    if (!nextDialCode) return;
    const currentDigits = phoneNumber.replace(/\D/g, '');
    const trimmed = trimTooLongNationalDigits(currentDigits, nextCode, nextDialCode);
    setPhoneNumber(formatNationalNumber(trimmed, nextCode));
  };

  const handlePhoneChange = (value: string) => {
    const sanitized = value.replace(/[^\d+]/g, '');
    let targetCountryCode = countryCode;
    let targetDialCode = activeDialCode;
    let nationalDigits = sanitized.replace(/\D/g, '');
    setPhoneLengthError(null);

    if (sanitized.startsWith('+')) {
      const parsed = parsePhoneNumberFromString(sanitized);
      if (parsed?.country && countryOptions.some((country) => country.code === parsed.country as string)) {
        targetCountryCode = parsed.country;
        targetDialCode = `+${getCountryCallingCode(parsed.country as CountryCode)}`;
        nationalDigits = (parsed.nationalNumber || '').replace(/\D/g, '');
        setCountryCode(parsed.country);
      }
    }

    const trimmedDigits = trimTooLongNationalDigits(nationalDigits, targetCountryCode, targetDialCode);
    if (trimmedDigits.length !== nationalDigits.length) {
      setPhoneLengthError('Phone number is too long for this country.');
    }

    setPhoneNumber(formatNationalNumber(trimmedDigits, targetCountryCode));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const nationalDigits = phoneNumber.replace(/\D/g, '');
      const combinedPhone = nationalDigits ? `${activeDialCode}${nationalDigits}` : '';
      const lengthStatus = validatePhoneNumberLength(combinedPhone, countryCode as CountryCode);
      if (lengthStatus) {
        setError('Please enter a valid phone number.');
        setLoading(false);
        return;
      }
      const payload = isSignup
        ? { firstName, lastName, countryCode, phoneNumber: combinedPhone, password }
        : { countryCode, phoneNumber: combinedPhone, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Authentication failed.');
      }

      router.push(next);
      router.refresh();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc,#ffffff_48%)] text-neutral-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {isSignup ? 'Create your profile' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {isSignup
            ? 'Sign up to access AI chat and save all conversations.'
            : 'Login to continue your saved AI conversations.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignup ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
                required
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
                required
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-[142px_1fr] gap-3">
            <div ref={countryDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setCountryMenuOpen((previous) => !previous)}
                className="w-full inline-flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none hover:border-neutral-300"
                aria-label="Select country code"
              >
                <span className="inline-flex items-center gap-2">
                  <ReactCountryFlag countryCode={countryCode} svg style={{ width: '1.1em', height: '1.1em' }} />
                  <span className="font-semibold text-neutral-700">{activeDialCode}</span>
                </span>
                <ChevronDown size={16} className="text-neutral-500" />
              </button>

              {countryMenuOpen ? (
                <div className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl">
                  {countryOptions.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country.code)}
                      className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-neutral-50"
                    >
                      <ReactCountryFlag countryCode={country.code} svg style={{ width: '1.1em', height: '1.1em' }} />
                      <span className="font-semibold text-neutral-700">{country.dialCode}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <input
              value={phoneNumber}
              onChange={(event) => handlePhoneChange(event.target.value)}
              placeholder="90 123 45 67"
              inputMode="tel"
              autoComplete="tel-national"
              required
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          {phoneLengthError ? <p className="text-xs text-amber-600">{phoneLengthError}</p> : null}

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (minimum 8 characters)"
            minLength={8}
            required
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-black disabled:opacity-40 py-2.5 text-sm font-semibold text-white"
          >
            {loading ? 'Please wait...' : isSignup ? 'Sign up' : 'Login'}
            <ArrowRight size={15} />
          </button>
        </form>

        <p className="mt-5 text-sm text-neutral-500">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link
            href={isSignup ? `/login?next=${encodeURIComponent(next)}` : `/signup?next=${encodeURIComponent(next)}`}
            className="text-neutral-900 font-semibold hover:text-neutral-700"
          >
            {isSignup ? 'Login' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  );
}
