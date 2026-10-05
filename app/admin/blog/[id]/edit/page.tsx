'use client'

import { useParams } from 'next/navigation'
import BlogFormPage from '../../new/page'

export default function AdminEditBlogPage() {
  const params = useParams()
  return <BlogFormPage params={{ id: params.id as string }} />
}
