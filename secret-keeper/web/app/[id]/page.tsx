'use client';
import { useParams } from 'next/navigation';
import SecretReveal from '@/components/SecretReveal';

export default function ViewSecretPage() {
  const params = useParams();
  const noteId = params?.id as string;

  if (!noteId) return null;
  
  return (
    <SecretReveal noteId={noteId} />
  );
}