import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/types';

export function useNextBillingDate(subscription: Subscription | undefined) {
  const [nextBillingDate, setNextBillingDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateNextBillingDate = async () => {
      if (!subscription) {
        setNextBillingDate(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data: nextBillingDateStr, error: rpcError } = await supabase.rpc('get_next_billing_date', {
          initial_date: subscription.billing_date,
          renewal_period_text: subscription.renewal_period
        });

        if (rpcError) {
          throw new Error(`Erro ao calcular próxima data: ${rpcError.message}`);
        }

        if (nextBillingDateStr) {
          setNextBillingDate(new Date(`${nextBillingDateStr}T00:00:00`));
        } else {
          setNextBillingDate(null);
        }
      } catch (err: any) {
        setError(err.message);
        setNextBillingDate(null);
      } finally {
        setIsLoading(false);
      }
    };

    calculateNextBillingDate();
  }, [subscription?.billing_date, subscription?.renewal_period]);

  return { nextBillingDate, isLoading, error };
} 