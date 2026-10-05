 "use client";
 
 import { useEffect } from "react";
 import { useRouter } from "next/navigation";
 
 export default function ShopRedirectPage() {
   const router = useRouter();
   useEffect(() => {
     const search = typeof window !== "undefined" ? window.location.search : "";
     router.replace(`/collection${search || ""}`);
   }, [router]);
   return null;
 }
