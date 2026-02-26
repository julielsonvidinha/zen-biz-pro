
-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text,
  sku text,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  stock_qty numeric(12,3) NOT NULL DEFAULT 0,
  min_stock numeric(12,3) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'UN',
  ncm text,
  cfop text DEFAULT '5102',
  cst text DEFAULT '00',
  category text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number serial,
  customer_name text,
  customer_cpf text,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'dinheiro',
  status text NOT NULL DEFAULT 'finalizada',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sale items
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  product_name text NOT NULL,
  qty numeric(12,3) NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  total numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Stock movements
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'entrada' or 'saida'
  qty numeric(12,3) NOT NULL,
  reason text,
  reference_id uuid,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Financial movements (caixa)
CREATE TABLE public.financial_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'entrada' or 'saida'
  amount numeric(12,2) NOT NULL,
  description text NOT NULL,
  payment_method text,
  reference_id uuid,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices (NF-e / NFC-e)
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) NOT NULL,
  type text NOT NULL DEFAULT 'nfce', -- 'nfe' or 'nfce'
  number integer,
  series integer DEFAULT 1,
  status text NOT NULL DEFAULT 'pendente', -- pendente, autorizada, rejeitada, cancelada
  access_key text,
  protocol text,
  xml text,
  danfe_url text,
  rejection_reason text,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Products: all authenticated can read, admin/gerente can write
CREATE POLICY "Authenticated can view active products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gerente can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'));
CREATE POLICY "Admin/Gerente can update products" ON public.products FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'));
CREATE POLICY "Admin can delete products" ON public.products FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Sales: authenticated can insert, view own or admin/gerente view all
CREATE POLICY "Users can insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own sales" ON public.sales FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'));
CREATE POLICY "Admin/Gerente can update sales" ON public.sales FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'));

-- Sale items: follow sale access
CREATE POLICY "Users can insert sale items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.sales WHERE id = sale_id AND user_id = auth.uid()));
CREATE POLICY "Users can view sale items" ON public.sale_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.sales WHERE id = sale_id AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))));

-- Stock movements
CREATE POLICY "Authenticated can insert stock movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can view stock movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);

-- Financial movements
CREATE POLICY "Authenticated can insert financial movements" ON public.financial_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin/Gerente can view financial movements" ON public.financial_movements FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente') OR auth.uid() = user_id);

-- Invoices
CREATE POLICY "Users can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view invoices" ON public.invoices FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente') OR auth.uid() = user_id);
CREATE POLICY "Admin can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'));

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to finalize sale (atomic: insert sale + items + stock + financial)
CREATE OR REPLACE FUNCTION public.finalize_sale(
  p_customer_name text DEFAULT NULL,
  p_customer_cpf text DEFAULT NULL,
  p_subtotal numeric DEFAULT 0,
  p_discount numeric DEFAULT 0,
  p_total numeric DEFAULT 0,
  p_payment_method text DEFAULT 'dinheiro',
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id uuid;
  v_user_id uuid;
  v_item jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert sale
  INSERT INTO public.sales (customer_name, customer_cpf, user_id, subtotal, discount, total, payment_method, status)
  VALUES (p_customer_name, p_customer_cpf, v_user_id, p_subtotal, p_discount, p_total, p_payment_method, 'finalizada')
  RETURNING id INTO v_sale_id;

  -- Insert items and update stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.sale_items (sale_id, product_id, product_name, qty, unit_price, total)
    VALUES (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      (v_item->>'qty')::numeric,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total')::numeric
    );

    -- Decrease stock
    UPDATE public.products SET stock_qty = stock_qty - (v_item->>'qty')::numeric
    WHERE id = (v_item->>'product_id')::uuid;

    -- Record stock movement
    INSERT INTO public.stock_movements (product_id, type, qty, reason, reference_id, user_id)
    VALUES (
      (v_item->>'product_id')::uuid,
      'saida',
      (v_item->>'qty')::numeric,
      'Venda #' || v_sale_id::text,
      v_sale_id,
      v_user_id
    );
  END LOOP;

  -- Record financial movement
  INSERT INTO public.financial_movements (type, amount, description, payment_method, reference_id, user_id)
  VALUES ('entrada', p_total, 'Venda finalizada', p_payment_method, v_sale_id, v_user_id);

  RETURN v_sale_id;
END;
$$;
