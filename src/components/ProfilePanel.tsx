'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AsYouType, CountryCode, getCountryCallingCode, parsePhoneNumberFromString, validatePhoneNumberLength } from 'libphonenumber-js';
import { AlertTriangle, ArrowLeft, KeyRound, LogOut, Save, ShieldAlert, UserRoundCheck } from 'lucide-react';
import { countries } from '@/lib/countries';

interface ProfilePanelProps {
  user: {
    firstName: string;
    lastName: string;
    phoneE164: string;
    phoneCountry: string;
  };
}

export default function ProfilePanel({ user }: ProfilePanelProps) {
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const countryOptions = useMemo(() => {
    return countries
      .map((country) => {
        try {
          return {
            code: country.code,
            name: country.name,
            dialCode: `+${getCountryCallingCode(country.code as CountryCode)}`,
          };
        } catch {
          return null;
        }
      })
      .filter((country): country is { code: string; name: string; dialCode: string } => Boolean(country));
  }, []);

  const formatNationalNumber = (digits: string, countryCode: string) => {
    return new AsYouType(countryCode as CountryCode).input(digits);
  };

  const trimTooLongNationalDigits = (digits: string, targetCountry: string, dialCode: string) => {
    let result = digits;
    while (result) {
      const status = validatePhoneNumberLength(`${dialCode}${result}`, targetCountry as CountryCode);
      if (status !== 'TOO_LONG') break;
      result = result.slice(0, -1);
    }
    return result;
  };

  const getNationalNumber = (phoneE164: string, countryCode: string) => {
    try {
      const parsed = parsePhoneNumberFromString(phoneE164, countryCode as CountryCode);
      if (parsed?.nationalNumber) {
        return formatNationalNumber(parsed.nationalNumber, countryCode);
      }
      return phoneE164;
    } catch {
      return phoneE164;
    }
  };

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [countryCode, setCountryCode] = useState(user.phoneCountry);
  const [phoneNumber, setPhoneNumber] = useState(getNationalNumber(user.phoneE164, user.phoneCountry));
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [phoneLengthError, setPhoneLengthError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const activeCountry = countryOptions.find((country) => country.code === countryCode) || countryOptions[0];
  const activeDialCode = activeCountry?.dialCode || '+998';

  const updatePhoneForCountry = (nextCountryCode: string, rawInput: string) => {
    const digits = rawInput.replace(/\D/g, '');
    const nextDialCode = countryOptions.find((country) => country.code === nextCountryCode)?.dialCode || activeDialCode;
    const trimmed = trimTooLongNationalDigits(digits, nextCountryCode, nextDialCode);
    if (trimmed.length !== digits.length) {
      setPhoneLengthError('Phone number is too long for selected country.');
    } else {
      setPhoneLengthError(null);
    }
    setPhoneNumber(formatNationalNumber(trimmed, nextCountryCode));
  };

  const handleCountryChange = (value: string) => {
    setCountryCode(value);
    updatePhoneForCountry(value, phoneNumber);
  };

  const handlePhoneChange = (value: string) => {
    updatePhoneForCountry(countryCode, value);
  };

  const buildPhoneE164 = () => {
    const nationalDigits = phoneNumber.replace(/\D/g, '');
    return nationalDigits ? `${activeDialCode}${nationalDigits}` : '';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const nextPhone = buildPhoneE164();
      const lengthStatus = validatePhoneNumberLength(nextPhone, countryCode as CountryCode);
      if (lengthStatus) {
        setProfileError('Please provide a valid phone number.');
        return;
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          countryCode,
          phoneNumber: nextPhone,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        user?: {
          firstName: string;
          lastName: string;
          phoneE164: string;
          phoneCountry: string;
        };
      };

      if (!response.ok) {
        throw new Error(data.error || 'Profile update failed.');
      }

      if (data.user) {
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);
        setCountryCode(data.user.phoneCountry);
        setPhoneNumber(getNationalNumber(data.user.phoneE164, data.user.phoneCountry));
      }

      setProfileSuccess('Profile updated successfully.');
      router.refresh();
    } catch (error: unknown) {
      setProfileError(error instanceof Error ? error.message : 'Profile update failed.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      if (newPassword !== confirmPassword) {
        setPasswordError('New password and confirmation do not match.');
        return;
      }

      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password changed successfully. Other sessions were logged out.');
      router.refresh();
    } catch (error: unknown) {
      setPasswordError(error instanceof Error ? error.message : 'Password reset failed.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
        setDeleteError('Type DELETE to confirm account removal.');
        return;
      }

      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Account deletion failed.');
      }

      router.push('/');
      router.refresh();
    } catch (error: unknown) {
      setDeleteError(error instanceof Error ? error.message : 'Account deletion failed.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
          >
            <ArrowLeft size={14} />
            Back home
          </Link>
          <button
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-2 rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile settings</h1>
          <p className="mt-2 text-sm text-neutral-300">
            Account ma&apos;lumotlaringizni yangilang, parolni almashtiring va kerak bo&apos;lsa profilingizni o&apos;chiring.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <UserRoundCheck size={16} className="text-emerald-300" />
            <h2 className="text-lg font-semibold">Profile CRUD</h2>
          </div>

          <form className="space-y-4" onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
                required
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/30"
              />
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
                required
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/30"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
              <select
                value={countryCode}
                onChange={(event) => handleCountryChange(event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/30"
              >
                {countryOptions.map((country) => (
                  <option key={country.code} value={country.code} className="text-black">
                    {country.code} ({country.dialCode}) - {country.name}
                  </option>
                ))}
              </select>
              <input
                value={phoneNumber}
                onChange={(event) => handlePhoneChange(event.target.value)}
                placeholder="Phone number"
                inputMode="tel"
                required
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/30"
              />
            </div>

            {phoneLengthError ? <p className="text-sm text-amber-300">{phoneLengthError}</p> : null}
            {profileError ? <p className="text-sm text-red-300">{profileError}</p> : null}
            {profileSuccess ? <p className="text-sm text-emerald-300">{profileSuccess}</p> : null}

            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <Save size={15} />
              {profileLoading ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={16} className="text-blue-300" />
            <h2 className="text-lg font-semibold">Reset password</h2>
          </div>

          <form className="space-y-3" onSubmit={handlePasswordReset}>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              minLength={8}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/30"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              minLength={8}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/30"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              minLength={8}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/30"
            />

            {passwordError ? <p className="text-sm text-red-300">{passwordError}</p> : null}
            {passwordSuccess ? <p className="text-sm text-emerald-300">{passwordSuccess}</p> : null}

            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 px-4 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/30 disabled:opacity-50"
            >
              {passwordLoading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-red-300/25 bg-red-950/20 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-300" />
            <h2 className="text-lg font-semibold text-red-200">Danger zone</h2>
          </div>
          <p className="mb-4 text-sm text-red-100/80">
            Bu amal qaytarib bo&apos;lmaydi. Profil, sessiyalar va chat tarixingiz o&apos;chib ketadi.
          </p>

          <form className="space-y-3" onSubmit={handleDeleteAccount}>
            <input
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              placeholder="Enter your password"
              minLength={8}
              required
              className="w-full rounded-xl border border-red-200/20 bg-red-500/10 px-3 py-2.5 text-sm outline-none focus:border-red-200/40"
            />
            <input
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder='Type "DELETE" to confirm'
              required
              className="w-full rounded-xl border border-red-200/20 bg-red-500/10 px-3 py-2.5 text-sm outline-none focus:border-red-200/40"
            />

            {deleteError ? <p className="text-sm text-red-200">{deleteError}</p> : null}

            <button
              type="submit"
              disabled={deleteLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-50"
            >
              <AlertTriangle size={15} />
              {deleteLoading ? 'Deleting...' : 'Delete account'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
