import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Camera, Check, ShieldCheck, Eye, EyeOff } from 'lucide-react'; // Menambahkan Eye dan EyeOff
import { useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function AdminForm({
    admin = null,
    countries = [],
    storeBranches = [],
}) {
    const isEditing = Boolean(admin);
    const avatarInputRef = useRef(null);
    const { t } = useLanguage();

    const resolveAvatarUrl = () => {
        if (!admin?.avatar) {
            return '/images/default-profile.png';
        }

        if (admin.avatar.startsWith('http') || admin.avatar.startsWith('/')) {
            return admin.avatar;
        }

        return `/storage/${admin.avatar}`;
    };

    const [avatarPreview, setAvatarPreview] = useState(resolveAvatarUrl());

    const form = useForm({
        name: admin?.name ?? '',
        avatar: null,
        email: admin?.email ?? '',
        password: '',
        phone: admin?.phone ?? '',
        country: admin?.country ?? '',
        address: admin?.address ?? '',
        assigned_branch_id: admin?.assigned_branch_id?.toString() ?? '',
    });

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        form.setData('avatar', file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const submit = (event) => {
        event.preventDefault();

        const payload = {
            ...form.data,
            assigned_branch_id: form.data.assigned_branch_id,
        };

        if (isEditing) {
            form.transform(() => ({
                ...payload,
                _method: 'patch',
            }));

            form.post(route('backoffice.admin.update', admin.id), {
                forceFormData: true,
                preserveScroll: true,
            });

            return;
        }

        form.transform(() => payload);
        form.post(route('backoffice.admin.store'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={isEditing ? t('admin.form.title.edit', 'Edit Admin') : t('admin.form.title.create', 'Create Admin')} />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    {isEditing ? t('admin.form.title.edit', 'Edit Admin') : t('admin.form.title.create', 'Create Admin')}
                                </h1>
                            </div>

                            <Link
                                href={route('backoffice.admin')}
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t('admin.form.button.back', 'Back to List')}
                            </Link>
                        </section>

                        <section className="w-full max-w-4xl p-5 mx-auto bg-white border border-blue-100 rounded-lg shadow-sm">
                            <div className="flex items-start justify-between gap-3 pb-4 border-b border-blue-100">
                                <div>
                                    <h2 className="text-lg font-bold text-blue-950">
                                        {isEditing ? t('admin.form.card.title.edit', 'Admin Form') : t('admin.form.card.title.create', 'New Admin Form')}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {t('admin.form.card.subtitle', 'Fill in the admin data below.')}
                                    </p>
                                </div>

                                <div className="inline-flex items-center justify-center text-blue-700 bg-blue-100 rounded-lg h-9 w-9">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                            </div>

                            <form className="mt-5 space-y-5" onSubmit={submit}>
                                <div className="flex flex-col items-center">
                                    <div
                                        className="relative cursor-pointer group"
                                        onClick={() => avatarInputRef.current?.click()}
                                    >
                                        <div className="overflow-hidden border-4 border-white rounded-full shadow-lg h-28 w-28 ring-2 ring-blue-200">
                                            <img
                                                src={avatarPreview}
                                                alt="Avatar preview"
                                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center transition rounded-full opacity-0 bg-black/35 group-hover:opacity-100">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                    </div>

                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />

                                    <p className="mt-3 text-xs text-slate-500">
                                        {t('admin.form.avatar.hint', 'Click avatar to upload image. Max 2MB.')}
                                    </p>
                                    {form.data.avatar && (
                                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                            <Check className="h-3.5 w-3.5" />
                                            <span>{form.data.avatar.name}</span>
                                        </div>
                                    )}
                                    {form.errors.avatar && (
                                        <p className="mt-2 text-xs font-medium text-rose-600">
                                            {form.errors.avatar}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        label={t('admin.form.field.name', 'Name')}
                                        required
                                        value={form.data.name}
                                        onChange={(value) => form.setData('name', value)}
                                        error={form.errors.name}
                                    />

                                    <FormField
                                        label={t('admin.form.field.email', 'Email')}
                                        required
                                        type="email"
                                        value={form.data.email}
                                        onChange={(value) => form.setData('email', value)}
                                        error={form.errors.email}
                                    />

                                    {/* Kolom Password otomatis memiliki fitur Eye/EyeOff */}
                                    <FormField
                                        label={t('admin.form.field.password', 'Password')}
                                        required={!isEditing}
                                        type="password"
                                        placeholder={isEditing ? t('admin.form.field.password.placeholder', 'Leave blank to keep current password') : ''}
                                        value={form.data.password}
                                        onChange={(value) => form.setData('password', value)}
                                        error={form.errors.password}
                                    />

                                    <FormField
                                        label={t('admin.form.field.phone', 'Phone')}
                                        required
                                        value={form.data.phone}
                                        onChange={(value) => form.setData('phone', value)}
                                        error={form.errors.phone}
                                    />

                                    <SelectField
                                        label={t('admin.form.field.country', 'Country')}
                                        required
                                        value={form.data.country}
                                        onChange={(value) => form.setData('country', value)}
                                        error={form.errors.country}
                                    >
                                        <option value="">{t('admin.form.field.country.placeholder', 'Select country')}</option>
                                        {countries.map((country) => (
                                            <option key={country.code} value={country.code}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </SelectField>

                                    <SelectField
                                        label={t('admin.form.field.branch', 'Branch Store')}
                                        required
                                        value={form.data.assigned_branch_id}
                                        onChange={(value) => form.setData('assigned_branch_id', value)}
                                        error={form.errors.assigned_branch_id}
                                    >
                                        <option value="">{t('admin.form.field.branch.placeholder', 'Select branch store')}</option>
                                        {storeBranches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </SelectField>
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-blue-950">
                                        {t('admin.form.field.address', 'Address')} <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={form.data.address}
                                        onChange={(event) => form.setData('address', event.target.value)}
                                        className="w-full rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                                    />
                                    {form.errors.address && (
                                        <p className="mt-2 text-xs font-medium text-rose-600">
                                            {form.errors.address}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isEditing ? t('admin.form.button.submit.edit', 'Update Admin') : t('admin.form.button.submit.create', 'Create Admin')}
                                    </button>

                                    <Link
                                        href={route('backoffice.admin')}
                                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        {t('admin.form.button.cancel', 'Cancel')}
                                    </Link>
                                </div>
                            </form>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}

// Komponen FormField yang diperbarui untuk mendukung visibilitas password
function FormField({ label, required = false, error, onChange, type = "text", ...props }) {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === "password";

    // Menentukan tipe input dinamis jika properti type adalah password
    const inputType = isPasswordType ? (showPassword ? "text" : "password") : type;

    return (
        <div>
            <label className="block mb-2 text-sm font-semibold text-blue-950">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
                <input
                    {...props}
                    type={inputType}
                    onChange={(event) => onChange?.(event.target.value)}
                    className={`w-full rounded-lg border border-blue-100 bg-blue-50/40 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 ${isPasswordType ? 'pl-3 pr-10' : 'px-3'
                        }`}
                />

                {isPasswordType && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 transition text-slate-400 hover:text-blue-950"
                    >
                        {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>
            )}
        </div>
    );
}

function SelectField({ label, required = false, error, onChange, children, ...props }) {
    return (
        <div>
            <label className="block mb-2 text-sm font-semibold text-blue-950">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <select
                {...props}
                onChange={(event) => onChange?.(event.target.value)}
                className="w-full rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
            >
                {children}
            </select>
            {error && (
                <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>
            )}
        </div>
    );
}