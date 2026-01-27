'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useCRM } from '@/hooks/useCRM';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
    full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().min(10, 'Telefone inválido').optional().or(z.literal('')),
    document: z.string().optional(),
});

interface ContactFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (contactId: string) => void;
}

export function ContactForm({ open, onOpenChange, onSuccess }: ContactFormProps) {
    const { createContact } = useCRM();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: '',
            email: '',
            phone: '',
            document: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            const newContact = await createContact({
                full_name: values.full_name,
                email: values.email || null,
                phone: values.phone || null,
                document: values.document || null,
            });

            toast({
                title: 'Contato criado',
                description: `${values.full_name} foi adicionado à sua lista.`,
            });

            form.reset();
            onOpenChange(false);
            onSuccess?.(newContact.id);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erro ao criar contato',
                description: 'Tente novamente mais tarde.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Contato</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome Completo *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: João da Silva" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="joao@exemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone (WhatsApp)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="(11) 99999-9999" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Contato
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
