import React from 'react';
import { useState, useEffect } from 'react';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  currency: string;
  color: string;
}

interface BookingWidgetProps {
  siteId: string;
  apiUrl: string;
  theme?: 'light' | 'dark';
  primaryColor?: string;
}

/**
 * Embeddable booking widget for client websites
 */
export function BookingWidget({
  siteId,
  apiUrl,
  theme = 'light',
  primaryColor = '#3b82f6',
}: BookingWidgetProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'service' | 'datetime' | 'details' | 'confirm'>('service');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/modules/booking/services?site_id=${siteId}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data.services || []);
    } catch (err) {
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const startTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);

      const response = await fetch(`${apiUrl}/api/modules/booking/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          service_id: selectedService.id,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          notes,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create booking');
      
      setStep('confirm');
    } catch (err) {
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '500px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      color: theme === 'dark' ? '#f9fafb' : '#111827',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    heading: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
    },
    button: {
      backgroundColor: primaryColor,
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      width: '100%',
    },
    serviceCard: {
      padding: '16px',
      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
      borderRadius: '8px',
      marginBottom: '12px',
      cursor: 'pointer',
    },
    input: {
      width: '100%',
      padding: '12px',
      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
      borderRadius: '8px',
      marginBottom: '12px',
      backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
      color: theme === 'dark' ? '#f9fafb' : '#111827',
    },
  };

  if (loading && services.length === 0) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.container}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      {/* Step 1: Select Service */}
      {step === 'service' && (
        <>
          <h2 style={styles.heading}>Select a Service</h2>
          {services.map((service) => (
            <div
              key={service.id}
              style={{
                ...styles.serviceCard,
                borderColor: selectedService?.id === service.id ? primaryColor : undefined,
              }}
              onClick={() => setSelectedService(service)}
            >
              <div style={{ fontWeight: 'bold' }}>{service.name}</div>
              {service.description && (
                <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>{service.description}</div>
              )}
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{service.duration_minutes} min</span>
                <span>{service.currency} {service.price}</span>
              </div>
            </div>
          ))}
          <button
            style={styles.button}
            disabled={!selectedService}
            onClick={() => setStep('datetime')}
          >
            Continue
          </button>
        </>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 'datetime' && (
        <>
          <h2 style={styles.heading}>Select Date & Time</h2>
          <input
            type="date"
            style={styles.input}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
          {selectedDate && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map((time) => (
                <button
                  key={time}
                  style={{
                    padding: '8px',
                    border: `1px solid ${selectedTime === time ? primaryColor : '#e5e7eb'}`,
                    borderRadius: '4px',
                    backgroundColor: selectedTime === time ? primaryColor : 'transparent',
                    color: selectedTime === time ? '#ffffff' : 'inherit',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button style={{ ...styles.button, backgroundColor: '#6b7280' }} onClick={() => setStep('service')}>
              Back
            </button>
            <button
              style={styles.button}
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep('details')}
            >
              Continue
            </button>
          </div>
        </>
      )}

      {/* Step 3: Customer Details */}
      {step === 'details' && (
        <>
          <h2 style={styles.heading}>Your Details</h2>
          <input
            type="text"
            placeholder="Full Name *"
            style={styles.input}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email *"
            style={styles.input}
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            style={styles.input}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
          <textarea
            placeholder="Notes (optional)"
            style={{ ...styles.input, minHeight: '80px' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ ...styles.button, backgroundColor: '#6b7280' }} onClick={() => setStep('datetime')}>
              Back
            </button>
            <button
              style={styles.button}
              disabled={!customerName || !customerEmail}
              onClick={handleSubmit}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </>
      )}

      {/* Step 4: Confirmation */}
      {step === 'confirm' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
          <h2 style={styles.heading}>Booking Confirmed!</h2>
          <p>Thank you, {customerName}!</p>
          <p>A confirmation email has been sent to {customerEmail}.</p>
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6', borderRadius: '8px' }}>
            <div><strong>{selectedService?.name}</strong></div>
            <div>{selectedDate?.toLocaleDateString()} at {selectedTime}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingWidget;
