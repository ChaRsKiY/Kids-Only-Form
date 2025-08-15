"use client";

import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type SignatureCanvasType from 'react-signature-canvas';
import { useTranslations, useLocale } from 'next-intl';
import { MdOutlineDelete } from 'react-icons/md';
//import { Lexend } from 'next/font/google';
import { Input } from '@/components/ui/input';
import { formSchema, childSchema, FormType } from '@/schemas/subscription-form.schema';
import { Child, ErrorsType } from '@/types/child';
import { Button, Checkbox, Select, PhoneInput, SubscriptionModal, DateInput } from '@/components/ui';
import { MdOutlineAdd } from 'react-icons/md';

// Lazy heavy components (keep Google Maps loading unconditional as requested)
const SignatureCanvas = dynamic(async () => {
  const mod = await import('react-signature-canvas');
  const Component = mod.default;
  return React.forwardRef<SignatureCanvasType, any>((props, ref) => (
    <Component ref={ref as any} {...props} />
  ));
}, { ssr: false });
const LoadScript = dynamic<any>(() => import('@react-google-maps/api').then(m => m.LoadScript), { ssr: false });
const StandaloneSearchBox = dynamic<any>(() => import('@react-google-maps/api').then(m => m.StandaloneSearchBox), { ssr: false });


interface Branch {
  id: string;
  code: string;
  name: string;
  description?: string;
}

const INACTIVITY_TIMEOUT = 30000;

/*
const lexend = Lexend({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
*/

const initialForm: FormType = {
  firstName: '',
  lastName: '',
  email: '',
  dob: '',
  phone: '',
  street: '',
  postalCode: '',
  city: '',
  province: '',
  country: '',
  branchCode: '',
  agree: false,
  signature: '',
  children: [],
};

type Gender = 'male' | 'female' | 'other';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ru', label: 'Русский' },
  { code: 'sk', label: 'Slovenčina' },
];



export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const [form, setForm] = useState<FormType>(initialForm);
  const [errors, setErrors] = useState<ErrorsType>({});
  const [hasAddress, setHasAddress] = useState<boolean>(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const sigCanvasRef = useRef<SignatureCanvasType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [isMapsReady, setIsMapsReady] = useState(false);
  const [showIdleModal, setShowIdleModal] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(20);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [modalStatus, setModalStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [modalError, setModalError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedBranchForPair, setSelectedBranchForPair] = useState<string>('');
  const pendingSignatureRef = useRef<string>('');
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const dirtyFields: (keyof FormType)[] = [
    'firstName', 'lastName', 'dob', 'phone',
    'street', 'postalCode', 'city', 'province', 'country', 'signature'
  ];
  const isChildrenDirty = form.children.some(
    child =>
      child.firstName !== '' ||
      child.lastName !== '' ||
      child.gender !== 'male' ||
      child.dob !== ''
  );
  const isFormDirty = dirtyFields.some(field => form[field] && form[field] !== '') || isChildrenDirty;

  const handleFormReset = () => {
    setForm(initialForm);
    setErrors({});
    setIsEmpty(true);
    setHasAddress(false);
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  useLayoutEffect(() => {
    let rafId: number | null = null;
    const scheduleUpdate = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setCanvasSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
        }
      });
    };
    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.removeEventListener('resize', scheduleUpdate);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);



  const handleClear = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
    setIsEmpty(true);
    setForm(f => ({ ...f, signature: '' }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.signature;
      return newErrors;
    });
  };

  const handleBegin = () => {
    setIsEmpty(false);
    // Снимаем ошибку подписи при начале рисования
    setErrors(prev => {
      const ne = { ...prev } as ErrorsType & Record<string, string>;
      delete (ne as any).signature;
      return ne as ErrorsType;
    });
  };

  // --- Signature onEnd ---
  const handleEnd = () => {
    if (sigCanvasRef.current) {
      const isEmpty = sigCanvasRef.current.isEmpty();
      
      if (isEmpty) {
        setIsEmpty(true);
        setForm(f => ({ ...f, signature: '' }));
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.signature;
          return newErrors;
        });
      } else {
        const signature = sigCanvasRef.current.getCanvas().toDataURL('image/png');
        setIsEmpty(false);
        setForm(f => ({ ...f, signature }));
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.signature;
          return newErrors;
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(f => {
      const updated = { ...f, [name]: type === 'checkbox' ? checked : value };
      const fieldSchema = formSchema.shape[name as keyof FormType];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(updated[name as keyof FormType]);
        setErrors(prev => {
          const newErrors = { ...prev };
          if (result.success) {
            delete newErrors[name as keyof FormType];
          }
          return newErrors;
        });
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Собираем все ошибки сразу
    const allErrors: Record<string, any> = {};

    // Проверка подписи
    const effectiveSignature = form.signature && form.signature.trim() !== '' ? form.signature : '';
    if (!effectiveSignature || effectiveSignature.trim() === '') {
      allErrors.signature = t('errors.signatureRequired');
    }
    
    // Проверка основных полей
    const requiredFields = ['firstName', 'lastName', 'email', 'dob'];
    for (const field of requiredFields) {
      if (!form[field as keyof FormType] || String(form[field as keyof FormType]).trim() === '') {
        allErrors[field] = t('errors.required');
      }
    }
    
    // Проверка согласия
    if (!form.agree) {
      allErrors.agree = t('errors.checkboxRequired');
    }

    // Проверка детей
    const hasIncompleteChildren = form.children.some(child => 
      !child.firstName.trim() || !child.lastName.trim() || !child.dob
    );
    if (hasIncompleteChildren) {
      allErrors.children = [{ firstName: 'errors.incompleteChildData' }];
    }

    // Проверка адреса только если он добавлен
    if (hasAddress) {
      const addressFields: (keyof FormType)[] = ['street', 'postalCode', 'city', 'province', 'country'];
      addressFields.forEach((f) => {
        const v = form[f];
        if (!v || String(v).trim() === '') {
          allErrors[f as string] = t('errors.required');
        }
      });
    }
    
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }
    
    setErrors({});

    try {
      const check = await fetch('/api/kiosk/check', { cache: 'no-store' });
      const json = await check.json();
      if (!json.kioskBranchCookie) {
        pendingSignatureRef.current = effectiveSignature;
        if (!selectedBranchForPair && branches.length > 0) {
          setSelectedBranchForPair(branches[0].code);
        }
        setShowBranchModal(true);
        return;
      }
    } catch {}

    await submitForm(effectiveSignature);
  };

  const submitForm = async (effectiveSignature: string) => {
    // Открываем модалку загрузки
    setModalStatus('loading');
    setIsModalOpen(true);
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, signature: effectiveSignature }),
      });
      const data = await response.json();
      if (!response.ok) {
        setModalStatus('error');
        if (data.details && typeof data.details === 'object') {
          const errorMessages = Object.values(data.details).join(', ');
          setModalError(t(errorMessages as string));
        } else {
          setModalError(t('errors.serverError') || 'Server error occurred');
        }
      } else {
        setModalStatus('success');
        handleFormReset();
      }
    } catch (error) {
      console.error('Network error:', error);
      setModalStatus('error');
      setModalError(t('errors.networkError') || 'Network error occurred');
    }
  };

  // Date change from custom DateInput (value is YYYY-MM-DD or empty)
  const handleDobChange = (value: string) => {
    // forbid future dates
    const todayISO = new Date().toISOString().slice(0,10);
    if (value && value > todayISO) return;
    setForm(f => ({ ...f, dob: value }));
    const result = formSchema.shape.dob.safeParse(value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (result.success) delete newErrors.dob;
      return newErrors;
    });
  };

  // --- Children handlers ---
  const handleChildChange = (idx: number, field: keyof Child, value: string) => {
    setForm(f => {
      const children = [...f.children];
      children[idx] = { ...children[idx], [field]: value };
      return { ...f, children };
    });
    const result = childSchema.shape[field].safeParse(value);
    setErrors(prev => {
      const newErrors: ErrorsType = { ...prev };
      if (!newErrors.children) newErrors.children = [];
      while (newErrors.children.length < form.children.length) newErrors.children.push({});
      if (result.success) {
        if (newErrors.children[idx]) delete newErrors.children[idx][field];
      }
      return newErrors;
    });
  };

  const handleChildDateChange = (idx: number, value: string) => {
    const todayISO = new Date().toISOString().slice(0,10);
    if (value && value > todayISO) return;
    handleChildChange(idx, 'dob', value || '');
  };

  const handleAddChild = () => {  
    if (form.children.length < 5) {
      setForm(f => ({ ...f, children: [...f.children, { firstName: '', lastName: '', gender: 'male', dob: '' }] }));
      setErrors(prev => {
        const newErrors: ErrorsType = { ...prev };

        if (!Array.isArray(newErrors.children)) {
          newErrors.children = [];
        }
        newErrors.children.push({});
        return newErrors;
      });
    }
  };
  const handleRemoveChild = (idx: number) => {
    setForm(f => ({ ...f, children: f.children.filter((_, i) => i !== idx) }));
    setErrors(prev => {
      const newErrors: ErrorsType = { ...prev };
      if (Array.isArray(newErrors.children)) {
        newErrors.children = newErrors.children.filter((_, i) => i !== idx);
      }
      return newErrors;
    });
  };

  // --- Address autofill ---
  const validateAddressFields = (newValues: Partial<FormType>) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      (['street', 'city', 'postalCode', 'province', 'country'] as const).forEach(field => {
        if (newValues[field] !== undefined) {
          const result = formSchema.shape[field].safeParse(newValues[field]);
          if (result.success) delete newErrors[field];
        }
      });
      return newErrors;
    });
  };

  React.useEffect(() => {
    if (selectedPlace && selectedPlace.address_components) {
      const get = (type: string) => selectedPlace.address_components?.find(c => c.types.includes(type))?.long_name || '';
      const newValues = {
        street: get('route') + (get('street_number') ? ' ' + get('street_number') : ''),
        city: get('locality') || get('postal_town') || '',
        postalCode: get('postal_code'),
        province: get('administrative_area_level_1'),
        country: get('country'),
      };
      setForm(f => ({ ...f, ...newValues }));
      validateAddressFields(newValues);
    }
  }, [selectedPlace]);

  // react-datepicker locales removed; using custom DateInput

  const resetIdleTimers = useCallback(() => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (modalTimeoutRef.current) clearInterval(modalTimeoutRef.current);
    setShowIdleModal(false);
    setIdleCountdown(20);
  }, []);

  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showIdleModal) {
      setShowIdleModal(false);
    }
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    if (isFormDirty) {
      idleTimeoutRef.current = setTimeout(() => {
        setShowIdleModal(true);
      }, INACTIVITY_TIMEOUT);
    }
  }, [showIdleModal, isFormDirty]);

  useEffect(() => {
    if (!isFormDirty) {
      resetIdleTimers();
      return;
    }
    const events = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'];
    events.forEach(evt => document.addEventListener(evt, handleUserActivity));
    idleTimeoutRef.current = setTimeout(() => {
      setShowIdleModal(true);
    }, INACTIVITY_TIMEOUT);
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      events.forEach(evt => document.removeEventListener(evt, handleUserActivity));
    };
  }, [isFormDirty, handleUserActivity]);

  // removed react-datepicker activity tracker



  useEffect(() => {
    if (!showIdleModal) {
      if (modalTimeoutRef.current) clearInterval(modalTimeoutRef.current);
      setIdleCountdown(20);
      return;
    }
    setIdleCountdown(20);
    let count = 20;
    modalTimeoutRef.current = setInterval(() => {
      count--;
      setIdleCountdown(count);
      if (count <= 0) {
        resetIdleTimers();
        handleFormReset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 1000);
    return () => {
      if (modalTimeoutRef.current) clearInterval(modalTimeoutRef.current);
    };
  }, [showIdleModal]);

  const handleModalClick = () => {
    resetIdleTimers();
    lastActivityRef.current = Date.now();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalStatus('loading');
    setModalError('');
  };

  const loadBranches = async () => {
    try {
      setIsLoadingBranches(true);
      const response = await fetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      } else {
        console.error('Failed to load branches');
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  return (
      <div className={`max-w-4xl mx-auto py-10 px-4`}>
        {/* Language Tabs */}
        <div className="flex justify-center border-b border-muted mb-8">
          {languages.map(lang => (
            <a
              key={lang.code}
              href={`/${lang.code}`}
              className={`px-6 py-3 font-semibold border-b-2 focus:outline-none ${locale === lang.code ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'}`}
            >
              {lang.label}
            </a>
          ))}
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {/* Title and Subtitle */}
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">{t('form.title')}</h1>
          <p className="text-center text-muted-foreground mb-8">{t('form.subtitle')}</p>

          {/* Personal Data Section */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">{t('form.personalData')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input name="firstName" value={form.firstName} onChange={handleChange} placeholder={t('form.firstName')} inputSize='lg' />
                {errors.firstName && <div className="text-red-500 text-xs mt-1">{errors.firstName}</div>}
              </div>
              <div>
                <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder={t('form.lastName')} inputSize='lg' />
                {errors.lastName && <div className="text-red-500 text-xs mt-1">{errors.lastName}</div>}
              </div>
              <div>
                <DateInput
                  name="dob"
                  value={form.dob}
                  onChange={handleDobChange}
                  placeholder={t('form.dob')}
                  inputSize='lg'
                  maxDate={new Date()}
                  locale={locale}
                  yearFrom={1900}
                  yearTo={new Date().getFullYear()}
                />
                {errors.dob && <div className="text-red-500 text-xs mt-1">{errors.dob}</div>}
              </div>
              <div>
                <PhoneInput
                  value={form.phone || ''}
                  onChange={(value) => {
                    setForm(f => ({ ...f, phone: value }));
                    if (errors.phone) {
                      setErrors(prev => ({ ...prev, phone: undefined }));
                    }
                  }}
                  placeholder={t('form.phone')}
                  error={errors.phone}
                />
                <p className="text-muted-foreground text-xs mt-1">{t('form.optional')}</p>
              </div>
            </div>
            <div className="mt-4">
              <Input name="email" value={form.email} onChange={handleChange} placeholder={t('form.email')} inputSize='lg' />
              {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
            </div>
          </div>

          {/* Children Section */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">{t('form.children')}</h2>
            {form.children.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground mb-4">{t('form.noChildren')}</p>
                <Button 
                  type="button" 
                  onClick={handleAddChild}
                  leftIcon={<MdOutlineAdd className="w-5 h-5" />}
                >
                  {t('form.addChild')}
                </Button>
              </div>
            ) : (
              <>
                {form.children.map((child, idx) => (
                  <div key={idx} className="mb-4 border border-muted rounded-lg p-4 relative">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        {t('form.child')} {idx + 1}
                      </div>
                      <div className="flex items-center justify-end">
                        <Button 
                          type="button" 
                          onClick={() => handleRemoveChild(idx)} 
                          variant="destructive-ghost" 
                          size='sm'
                        >
                          <MdOutlineDelete className="w-5 h-5" />
                        </Button>
                      </div>
                      <div>
                        <Input
                          name={`child-firstName-${idx}`}
                          value={child.firstName}
                          onChange={e => handleChildChange(idx, 'firstName', e.target.value)}
                          placeholder={t('form.childFirstName')}
                          inputSize='lg'
                        />
                        {Array.isArray(errors.children) && errors.children[idx]?.firstName && <div className="text-red-500 text-xs mt-1">{t(errors.children[idx].firstName)}</div>}
                      </div>
                      <div>
                        <Input
                          name={`child-lastName-${idx}`}
                          value={child.lastName}
                          onChange={e => handleChildChange(idx, 'lastName', e.target.value)}
                          placeholder={t('form.childLastName')}
                          inputSize='lg'
                        />
                        {Array.isArray(errors.children) && errors.children[idx]?.lastName && <div className="text-red-500 text-xs mt-1">{t(errors.children[idx].lastName)}</div>}
                      </div>
                      <div>
                        <Select
                          name={`child-gender-${idx}`}
                          value={child.gender}
                          onChange={(e) => handleChildChange(idx, 'gender', e.target.value as Gender)}
                          options={[
                            { label: t('form.male'), value: 'male' },
                            { label: t('form.female'), value: 'female' },
                            { label: t('form.other'), value: 'other' },
                          ]}
                          inputSize='lg'
                        />
                        {Array.isArray(errors.children) && errors.children[idx]?.gender && <div className="text-red-500 text-xs mt-1">{t(errors.children[idx].gender)}</div>}
                      </div>
                      <div>
                        <DateInput
                          name={`child-dob-${idx}`}
                          value={child.dob}
                          onChange={(v) => handleChildDateChange(idx, v)}
                          placeholder={t('form.childDob')}
                          inputSize='lg'
                          maxDate={new Date()}
                          locale={locale}
                          yearFrom={1900}
                          yearTo={new Date().getFullYear()}
                        />
                        {Array.isArray(errors.children) && errors.children[idx]?.dob && <div className="text-red-500 text-xs mt-1">{t(errors.children[idx].dob)}</div>}
                      </div>
                    </div>
                  </div>
                ))}
                {form.children.length < 5 && (
                  <Button 
                    type="button" 
                    onClick={handleAddChild}
                    variant="outline"
                    leftIcon={<MdOutlineAdd className="w-5 h-5" />}
                  >
                    {t('form.addChild')}
                  </Button>
                )}
              </>
            )}
            {Array.isArray(errors.children) && errors.children.some(child => child.firstName === 'errors.incompleteChildData') && (
              <div className="text-red-500 text-xs mt-2">{t('errors.incompleteChildData')}</div>
            )}
          </div>

          {/* Address Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{t('form.address')}</h2>
              {!hasAddress ? (
                <Button
                  type="button"
                  onClick={() => setHasAddress(true)}
                  leftIcon={<MdOutlineAdd className="w-5 h-5" />}
                  variant="outline"
                >
                  {t('form.addAddress')}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setHasAddress(false);
                    const cleared: Partial<FormType> = { street: '', postalCode: '', city: '', province: '', country: '' };
                    setForm(f => ({ ...f, ...cleared }));
                    setErrors(prev => {
                      const ne = { ...prev } as Record<string, string> & ErrorsType;
                      delete (ne as any).street; delete (ne as any).postalCode; delete (ne as any).city; delete (ne as any).province; delete (ne as any).country;
                      return ne as ErrorsType;
                    });
                  }}
                  variant="destructive-ghost"
                  size="sm"
                >
                  {t('form.removeAddress')}
                </Button>
              )}
            </div>
            {hasAddress && (
              <>
                <div className="grid grid-cols-1 gap-4 mb-3">
                  <div>
                    {hasAddress && isMapsReady ? (
                      <StandaloneSearchBox
                        onLoad={(ref: google.maps.places.SearchBox) => setSearchBox(ref)}
                        onPlacesChanged={() => {
                          const places = searchBox?.getPlaces();
                          if (places && places.length > 0) {
                            setSelectedPlace(places[0]);
                          }
                        }}
                      >
                        <Input 
                          name="street" 
                          value={form.street} 
                          onChange={handleChange} 
                          placeholder={t('form.street')} 
                          inputSize='lg'
                          autoComplete="off"
                        />
                      </StandaloneSearchBox>
                    ) : (
                      <Input name="street" value={form.street} onChange={handleChange} placeholder={t('form.street')} inputSize='lg' />
                    )}
                    {errors.street && <div className="text-red-500 text-xs mt-1">{errors.street}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <Input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder={t('form.postalCode')} inputSize='lg' />
                    {errors.postalCode && <div className="text-red-500 text-xs mt-1">{errors.postalCode}</div>}
                  </div>
                  <div>
                    <Input name="city" value={form.city} onChange={handleChange} placeholder={t('form.city')} inputSize='lg' />
                    {errors.city && <div className="text-red-500 text-xs mt-1">{errors.city}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input name="province" value={form.province} onChange={handleChange} placeholder={t('form.province')} inputSize='lg' />
                    {errors.province && <div className="text-red-500 text-xs mt-1">{errors.province}</div>}
                  </div>
                  <div>
                    <Input name="country" value={form.country} onChange={handleChange} placeholder={t('form.country')} inputSize='lg' />
                    {errors.country && <div className="text-red-500 text-xs mt-1">{errors.country}</div>}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Checkbox */}
          <div className="mb-6 flex items-start gap-2">
            <Checkbox
              name="agree"
              checked={form.agree}
              onChange={(checked: boolean) => handleChange({ target: { name: 'agree', value: checked } } as unknown as React.ChangeEvent<HTMLInputElement>)}
              label={
                <span>
                  {t('form.agreeStart')}{' '}
                  <a 
                    href={`/${locale}/privacy`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('form.privacyPolicy')}
                  </a>{' '}
                  {t('form.agreeMiddle')}{' '}
                  <a 
                    href="https://www.kidsonly.at/agb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('form.termsConditions')}
                  </a>
                  {t('form.agreeEnd')}
                </span>
              }
              id="agree"
            />
          </div>
          {errors.agree && <div className="text-red-500 text-xs mb-4">{errors.agree}</div>}

          {/* Signature Box */}
          <div className="mb-8">
            <div
              ref={containerRef}
              className="relative border-2 border-dashed border-muted rounded-lg bg-white w-full min-h-[250px] flex flex-col items-center justify-center"
              style={{ aspectRatio: '4/1' }}
            >
              {!isEmpty && (
                <Button
                  className="absolute top-2 right-2 z-10"
                  onClick={handleClear}
                  tabIndex={-1}
                  variant="outline"
                  size="sm"
                  leftIcon={<MdOutlineDelete className="w-4 h-4" />}
              >
                {t('form.clear')}
              </Button>
              )}
              
              {isEmpty && (
                <div className="flex flex-col items-center justify-center z-10 pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                  <span className="font-semibold mb-1">{t('form.signature')}</span>
                  <span className="text-sm text-muted-foreground">{t('form.signaturePlaceholder')}</span>
                </div>
              )}
              {canvasSize.width > 0 && canvasSize.height > 0 && (
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="#17171D"
                  backgroundColor="#fff"
                  canvasProps={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                    className: 'absolute top-0 left-0 w-full h-full rounded',
                    style: { width: '100%', height: '100%' }
                  }}
                  onBegin={handleBegin}
                  onEnd={handleEnd}
                />
              )}
            </div>
            {errors.signature && <div className="text-red-500 text-xs mt-1">{errors.signature}</div>}
          </div>

          {/* Subscribe Button */}
          <Button type="submit" className="w-full" size='lg'>{t('form.subscribe')}</Button>
        </form>
        
        {isFormDirty && (
          <Button
            type="button"
            onClick={handleFormReset}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 p-3"
          >
            <MdOutlineDelete className="w-5 h-5 text-secondary-foreground" />
          </Button>
        )}

        <LoadScript
          id="google-maps-script"
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          libraries={["places"]}
          onLoad={() => setIsMapsReady(true)}
        />
        {showIdleModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm"
            onClick={handleModalClick}
            style={{ cursor: 'pointer' }}
          >
            <div className="bg-white rounded-xl shadow-xl p-10 max-w-lg w-full text-center select-none">
              <div className="text-2xl font-bold mb-4">Still with us?</div>
              <div className="mb-4">We noticed you’ve stepped away. To keep your info safe,<br/>we’ll clear the form in 20 seconds.<br/><br/>Tap anywhere to keep going!</div>
              <div className="text-3xl font-bold">{idleCountdown}</div>
            </div>
          </div>
        )}

        {/* Subscription Modal */}
        <SubscriptionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          status={modalStatus}
          errorMessage={modalError}
        />

        {/* Branch Select Modal (no kiosk cookie) */}
        {showBranchModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40" onClick={() => setShowBranchModal(false)}>
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">{t('form.selectBranch') || 'Select branch'}</h3>
              <div className="mb-4">
                <Select
                  name="kiosk-branch"
                  value={selectedBranchForPair}
                  onChange={(e) => setSelectedBranchForPair((e as React.ChangeEvent<HTMLSelectElement>).target.value)}
                  options={branches.map(b => ({ label: `${b.name} (${b.code})`, value: b.code }))}
                  inputSize='lg'
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowBranchModal(false)}>{t('modal.close') || 'Close'}</Button>
                <Button
                  onClick={async () => {
                    if (!selectedBranchForPair) return;
                    // Ставим куку на клиенте, чтобы следующий запрос отправился с ней
                    const maxAge = 60 * 60 * 24 * 365 * 100; // ~100 лет
                    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
                    document.cookie = `kiosk-branch=${encodeURIComponent(selectedBranchForPair)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
                    setShowBranchModal(false);
                    await submitForm(pendingSignatureRef.current || form.signature);
                  }}
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
