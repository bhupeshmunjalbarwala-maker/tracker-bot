'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// getProductDetails function (no changes needed)
function getProductDetails(url, partNumber) {
  // ... (this function is the same as before) ...
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('apple.com')) {
      if (!partNumber) {
        throw new Error('Apple products require a Part Number.');
      }
      const name = (parsedUrl.pathname.split('/')[3] || 'Apple Product')
                   .replace(/-/g, ' ').slice(0, 50) + '...';
      return {
        name: `(Apple) ${name}`,
        productId: partNumber, 
        storeType: 'apple',
        partNumber: partNumber
      };
    }
    
    if (parsedUrl.hostname.includes('croma.com')) {
      const pathParts = parsedUrl.pathname.split('/');
      const pid = pathParts[pathParts.length - 1];
      if (!pid || !/^\d+$/.test(pid)) throw new Error('Could not find a valid product ID in the Croma URL.');
      const name = (pathParts[1] || 'Croma Product')
                   .replace(/-/g, ' ').slice(0, 50) + '...';
      return { 
        name: `(Croma) ${name}`, 
        productId: pid, 
        storeType: 'croma', 
        partNumber: null 
      };
    }

    throw new Error('Sorry, only Croma and Apple URLs are supported.');
  
  } catch (error) {
    return { error: error.message };
  }
}

// Server Action to add a product (UPDATE THIS)
export async function addProduct(formData) {
  const url = formData.get('url');
  const partNumber = formData.get('partNumber');
  
  // --- GET THE NEW FIELD ---
  const affiliateLink = formData.get('affiliateLink');

  if (!url) return { error: 'URL is required.' };

  const details = getProductDetails(url, partNumber);
  if (details.error) return { error: details.error };

  try {
    await prisma.product.create({
      data: {
        name: details.name,
        url: url,
        productId: details.productId,
        storeType: details.storeType,
        partNumber: details.partNumber,
        
        // --- SAVE THE NEW FIELD ---
        affiliateLink: affiliateLink || null, // Save it (or null if empty)
      },
    });
    revalidatePath('/');
    return { success: `Added ${details.name}` };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to add product. Is it a duplicate?' };
  }
}

// deleteProduct function (no changes needed)
export async function deleteProduct(id) {
 // ... (this function is the same as before) ...
  if (!id) return;
  try {
    await prisma.product.delete({ where: { id: id } });
    revalidatePath('/');
  } catch (error) {
    // Fail silently
  }
}