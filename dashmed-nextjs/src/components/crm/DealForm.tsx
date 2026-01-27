'use client';

import { useState, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { PIPELINE_STAGES } from '@/types/crm';
import { createClient } from '@/lib/supabase/client';

const formSchema = z.object({
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    value: z.coerce.number().min(0, 'Valor não pode ser negativo'),
    stage: z.string(),
    contact_id: z.string().min(1, 'Selecione um contato'),
});

interface DealFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DealForm({ open, onOpenChange }: DealFormProps) {
    const { createDeal } = useCRM();
    const [isLoading, setIsLoading] = useState(false);
    const [contacts, setContacts] = useState<{ id: string, full_name: string }[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const supabase = createClient();

    // Fetch contacts for simplicity
    useEffect(() => {
        if (open) {
            const fetchContacts = async () => {
                setIsLoadingContacts(true);
                const { data } = await supabase
                    .from('crm_contacts')
                    .select('id, full_name')
                    .limit(50);
                setContacts(data || []);
                setIsLoadingContacts(false);
            };
            fetchContacts();
        }
    }, [open]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            value: 0,
            stage: 'lead_novo',
            contact_id: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            await createDeal({
                title: values.title,
                value: values.value,
                stage: values.stage as any,
                contact_id: values.contact_id,
                pipeline_id: 'default', // TODO: Fetch real pipeline ID
            });

            toast({
                title: 'Deal criado',
                description: `O negócio ${values.title} foi criado.`,
            });

            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erro ao criar deal',
                description: 'Tente novamente mais tarde.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Novo Deal (Oportunidade)</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Tratamento Completo" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contact_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contato *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoadingContacts}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um contato" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {contacts.map((contact) => (
                                                <SelectItem key={contact.id} value={contact.id}>
                                                    {contact.full_name || 'Sem nome'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="stage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estágio</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PIPELINE_STAGES.map((stage) => (
                                                    <SelectItem key={stage.value} value={stage.value}>
                                                        {stage.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Deal
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
