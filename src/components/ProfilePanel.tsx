'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AsYouType, CountryCode, getCountryCallingCode, parsePhoneNumberFromString, validatePhoneNumberLength } from 'libphonenumber-js';
import { AlertTriangle, ArrowLeft, KeyRound, LogOut, Save, ShieldAlert, UserRoundCheck } from 'lucide-react';
import { countries } from '@/lib/countries';
import { authFetch, clearAuthToken, setAuthToken } from '@/lib/client-auth';

interface ProfilePanelProps {
  user: {
    firstName: string;
    lastName: string;
    email: string | null;
    avatarUrl: string | null;
    authProvider: string;
    hasPassword: boolean;
    phoneE164: string;
    phoneCountry: string;
  };
}

export default function ProfilePanel({ user }: ProfilePanelProps) {
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isGoogleOnly = user.authProvider === 'google' && !user.hasPassword;

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
    await authFetch('/api/auth/logout', { method: 'POST' });
    clearAuthToken();
    router.push('/');
    router.refresh();
  };

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const payload: {
        firstName: string;
        lastName: string;
        countryCode?: string;
        phoneNumber?: string;
      } = {
        firstName,
        lastName,
      };

      if (!isGoogleOnly) {
        const nextPhone = buildPhoneE164();
        const lengthStatus = validatePhoneNumberLength(nextPhone, countryCode as CountryCode);
        if (lengthStatus) {
          setProfileError('Please provide a valid phone number.');
          return;
        }
        payload.countryCode = countryCode;
        payload.phoneNumber = nextPhone;
      }

      const response = await authFetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        if (!isGoogleOnly) {
          setCountryCode(data.user.phoneCountry);
          setPhoneNumber(getNationalNumber(data.user.phoneE164, data.user.phoneCountry));
        }
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

      const response = await authFetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = (await response.json()) as { error?: string; token?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }
      if (typeof data.token === 'string' && data.token) {
        setAuthToken(data.token);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password updated successfully.');
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

      const response = await authFetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Account deletion failed.');
      }

      clearAuthToken();
      router.push('/');
      router.refresh();
    } catch (error: unknown) {
      setDeleteError(error instanceof Error ? error.message : 'Account deletion failed.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc,#ffffff_48%)] px-4 py-8 sm:px-6 sm:py-10 text-neutral-900">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-300"
          >
            <ArrowLeft size={14} />
            Back home
          </Link>
          <button
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7 shadow-[0_20px_80px_rgba(15,23,42,0.07)]">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt="Profile avatar"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border border-neutral-200 object-cover"
              />
            ) : (
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-lg font-bold text-neutral-700">
                {(user.firstName[0] || '') + (user.lastName[0] || '')}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight">Profile settings</h1>
              <p className="truncate text-sm text-neutral-500">
                {user.email || `${user.firstName} ${user.lastName}`}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {user.authProvider === 'google' ? 'Google account' : 'Phone account'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7 shadow-[0_20px_80px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2">
            <UserRoundCheck size={16} className="text-emerald-600" />
            <h2 className="text-lg font-semibold">Personal info</h2>
          </div>

          <form className="space-y-4" onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            {user.email ? (
              <input
                value={user.email}
                disabled
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500"
              />
            ) : null}

            {!isGoogleOnly ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
                <select
                  value={countryCode}
                  onChange={(event) => handleCountryChange(event.target.value)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                >
                  {countryOptions.map((country) => (
                    <option key={country.code} value={country.code}>
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
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                />
              </div>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Phone number is managed by Google sign-in for now. You can still update your name.
              </p>
            )}

            {phoneLengthError ? <p className="text-sm text-amber-700">{phoneLengthError}</p> : null}
            {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}
            {profileSuccess ? <p className="text-sm text-emerald-700">{profileSuccess}</p> : null}

            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
            >
              <Save size={15} />
              {profileLoading ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7 shadow-[0_20px_80px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={16} className="text-blue-600" />
            <h2 className="text-lg font-semibold">{user.hasPassword ? 'Change password' : 'Set password'}</h2>
          </div>

          {!user.hasPassword ? (
            <p className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              You signed in with Google. Set a password to enable password-based login as a backup.
            </p>
          ) : null}

          <form className="space-y-3" onSubmit={handlePasswordReset}>
            {user.hasPassword ? (
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
                minLength={8}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            ) : null}
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              minLength={8}
              required
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              minLength={8}
              required
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            />

            {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
            {passwordSuccess ? <p className="text-sm text-emerald-700">{passwordSuccess}</p> : null}

            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {passwordLoading ? 'Updating...' : user.hasPassword ? 'Update password' : 'Set password'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 sm:p-7">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-700" />
            <h2 className="text-lg font-semibold text-red-800">Danger zone</h2>
          </div>
          <p className="mb-4 text-sm text-red-700">
            This action is permanent. Profile, sessions, and chat history will be removed.
          </p>

          <form className="space-y-3" onSubmit={handleDeleteAccount}>
            {user.hasPassword ? (
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="Enter your password"
                minLength={8}
                required
                className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-400"
              />
            ) : null}
            <input
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder='Type "DELETE" to confirm'
              required
              className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-400"
            />

            {deleteError ? <p className="text-sm text-red-700">{deleteError}</p> : null}

            <button
              type="submit"
              disabled={deleteLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
