
import React from 'react';
import { useSearchParams } from 'next/navigation';
import NewDetails from '@components/HomePage/News/NewDetails';

export default function EditNewsPage() {
  const searchParams = useSearchParams();

  const initialData = {
    title: searchParams.get('title') || '',
    content: searchParams.get('content') || '',
    url: searchParams.get('url') || '',
    pinTop: searchParams.get('pinTop') === 'true',
    publish: searchParams.get('publish') === 'true',
    expireDate: searchParams.get('expireDate') || '',
    images: [searchParams.get('img') || ''],
  };

  return <NewDetails mode="edit" initialData={initialData} />;
}
