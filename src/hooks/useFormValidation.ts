/**
 * Hook pour validation de formulaires avec Zod et React Hook Form
 * Note: À utiliser quand React Hook Form sera nécessaire
 * Pour l'instant, utiliser directement Zod côté client
 */

// import { z } from "zod";
// import { toast } from "@/lib/toast";

// Temporairement désactivé jusqu'à ce que React Hook Form soit nécessaire
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// Temporairement désactivé - sera réactivé quand React Hook Form sera nécessaire
// export function useFormValidation<T extends z.ZodTypeAny>(
//   schema: T,
//   options?: {
//     onSubmit?: (data: z.infer<T>) => Promise<void> | void;
//     onError?: (errors: z.ZodError) => void;
//     defaultValues?: Partial<z.infer<T>>;
//   }
// ) {
//   // Implementation avec React Hook Form
// }
