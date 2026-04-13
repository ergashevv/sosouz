'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { fetchUniversities } from '@/lib/api';

const RECOMMENDED_LIMIT = 60;

const fetchRecommendedUniversities = async ([, country]: [string, string]) => {
  if (!country || country === "Worldwide") {
    return [];
  }
  return fetchUniversities(country);
};

export function useRecommendedUniversities(country: string) {
  const { data, error, isLoading } = useSWR(
    ['recommended-universities', country],
    fetchRecommendedUniversities,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
    },
  );

  const universities = useMemo(() => {
    const unique = new Set<string>();
    const names: string[] = [];

    for (const university of data || []) {
      const name = university?.name?.trim();
      if (!name || unique.has(name)) continue;
      unique.add(name);
      names.push(name);
      if (names.length >= RECOMMENDED_LIMIT) break;
    }

    return names;
  }, [data]);

  return {
    universities,
    isLoading,
    error,
  };
}
