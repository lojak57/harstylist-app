-- Add service_id foreign key to appointments table
ALTER TABLE public.appointments
ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS appointments_service_id_idx ON public.appointments(service_id);

-- Migrate existing data (using service_type to match services by name if possible)
UPDATE public.appointments
SET service_id = services.id
FROM public.services
WHERE appointments.service_type = services.name
AND appointments.stylist_id = services.stylist_id;

-- Comment to indicate this constraint is used by the application
COMMENT ON CONSTRAINT appointments_service_id_fkey ON public.appointments IS 'Foreign key relationship used by the application to join appointments with services';
