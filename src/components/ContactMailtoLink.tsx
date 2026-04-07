import { getContactEmail } from '@/lib/site';

type Props = {
  className?: string;
};

/** Visible text and mailto target use {@link getContactEmail}. */
export default function ContactMailtoLink({ className }: Props) {
  const email = getContactEmail();
  return (
    <a href={`mailto:${email}`} className={className}>
      {email}
    </a>
  );
}
