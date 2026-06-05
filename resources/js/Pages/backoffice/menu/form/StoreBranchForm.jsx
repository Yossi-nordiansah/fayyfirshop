import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Store, X } from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';

export default function StoreBranchForm({ storeBranch = null, countries = [], status }) {
    const { t } = useLanguage();
    const isEditing = Boolean(storeBranch);
    const form = useForm({
        name: storeBranch?.name ?? '',
        code: storeBranch?.code ?? '',
        country_name: storeBranch?.country_name ?? '',
        currency_code: storeBranch?.currency_code ?? '',
        currency_symbol: storeBranch?.currency_symbol ?? '',
        postal_code: storeBranch?.postal_code ?? '',
        is_active: storeBranch ? (storeBranch.is_active ? '1' : '0') : '1',
        timezone: storeBranch?.timezone ?? 'Asia/Jakarta',
        city: storeBranch?.city ?? '',
        street: storeBranch?.street ?? '',
        district: storeBranch?.district ?? '',
        province: storeBranch?.province ?? '',
        detail_address: storeBranch?.detail_address ?? '',
    });

    const submit = (event) => {
        event.preventDefault();

        const payload = {
            ...form.data,
            code: form.data.code.toUpperCase(),
            currency_code: form.data.currency_code.toUpperCase(),
            is_active: form.data.is_active === '1',
        };

        if (isEditing) {
            form.transform(() => payload);
            form.patch(route('backoffice.store-branches.update', storeBranch.id), {
                preserveScroll: true,
            });

            return;
        }

        form.transform(() => payload);
        form.post(route('backoffice.store-branches.store'), {
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head
                title={
                    isEditing
                        ? t('backoffice.store_branches.form.page_title_edit', 'Edit Store Branch')
                        : t('backoffice.store_branches.form.page_title_create', 'Create Store Branch')
                }
            />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="mt-2 text-3xl font-bold tracking-normal text-blue-950">
                                    {isEditing
                                        ? t('backoffice.store_branches.form.page_title_edit', 'Edit Store Branch')
                                        : t('backoffice.store_branches.form.page_title_create', 'Create Store Branch')}
                                </h1>
                                <p className="max-w-2xl mt-2 text-sm text-slate-600">
                                    {t(
                                        'backoffice.store_branches.form.description',
                                        'Fill in the branch information below. Only the fields you specified are required.',
                                    )}
                                </p>
                            </div>

                            <Link
                                href={route('backoffice.store-branches.index')}
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t('backoffice.store_branches.form.back_to_list', 'Back to List')}
                            </Link>
                        </section>

                        {status && (
                            <section className="px-4 py-3 text-sm font-medium border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700">
                                {status}
                            </section>
                        )}

                        <section className="w-full max-w-4xl p-5 mx-auto bg-white border border-blue-100 rounded-lg shadow-sm">
                            <div className="flex items-start justify-between gap-3 pb-4 border-b border-blue-100">
                                <div>
                                    <h2 className="text-lg font-bold text-blue-950">
                                        {isEditing
                                            ? t('backoffice.store_branches.form.title_edit', 'Branch Form')
                                            : t('backoffice.store_branches.form.title_create', 'New Branch Form')}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {t(
                                            'backoffice.store_branches.form.subtitle',
                                            'Required fields follow your latest spec.',
                                        )}
                                    </p>
                                </div>

                                <div className="inline-flex items-center justify-center text-blue-700 bg-blue-100 rounded-lg h-9 w-9">
                                    {isEditing ? (
                                        <X className="w-4 h-4" />
                                    ) : (
                                        <Store className="w-4 h-4" />
                                    )}
                                </div>
                            </div>

                            <form className="mt-5 space-y-4" onSubmit={submit}>
                                <FormField
                                    label={t('backoffice.store_branches.form.fields.name', 'Name')}
                                    required
                                    value={form.data.name}
                                    onChange={(value) => form.setData('name', value)}
                                    error={form.errors.name}
                                />

                                <FormField
                                    label={t('backoffice.store_branches.form.fields.code', 'Code')}
                                    required
                                    placeholder="MY, ID, SA"
                                    value={form.data.code}
                                    onChange={(value) => form.setData('code', value.toUpperCase())}
                                    error={form.errors.code}
                                />

                                <SelectField
                                    label={t('backoffice.store_branches.form.fields.country_name', 'Country Name')}
                                    required
                                    value={form.data.country_name}
                                    onChange={(value) => form.setData('country_name', value)}
                                    error={form.errors.country_name}
                                >
                                    <option value="">
                                        {t('backoffice.store_branches.form.placeholders.select_country', 'Select country')}
                                    </option>
                                    {countries.map((country) => (
                                        <option key={country.code} value={country.name}>
                                            {country.name}
                                        </option>
                                    ))}
                                </SelectField>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        label={t('backoffice.store_branches.form.fields.currency_code', 'Currency Code')}
                                        required
                                        placeholder="IDR"
                                        value={form.data.currency_code}
                                        onChange={(value) =>
                                            form.setData('currency_code', value.toUpperCase())
                                        }
                                        error={form.errors.currency_code}
                                    />
                                    <FormField
                                        label={t('backoffice.store_branches.form.fields.currency_symbol', 'Currency Symbol')}
                                        required
                                        placeholder="Rp, RM"
                                        value={form.data.currency_symbol}
                                        onChange={(value) => form.setData('currency_symbol', value)}
                                        error={form.errors.currency_symbol}
                                    />
                                </div>

                                <FormField
                                    label={t('backoffice.store_branches.form.fields.postal_code', 'Postal Code')}
                                    required
                                    value={form.data.postal_code}
                                    onChange={(value) => form.setData('postal_code', value)}
                                    error={form.errors.postal_code}
                                />

                                <div>
                                    <p className="mb-2 text-sm font-semibold text-blue-950">
                                        {t('backoffice.store_branches.form.fields.is_active', 'Is Active')} <span className="text-rose-500">*</span>
                                    </p>
                                    <div className="flex gap-3">
                                        <RadioCard
                                            checked={form.data.is_active === '1'}
                                            label={t('backoffice.store_branches.status.active', 'Active')}
                                            onChange={() => form.setData('is_active', '1')}
                                        />
                                        <RadioCard
                                            checked={form.data.is_active === '0'}
                                            label={t('backoffice.store_branches.status.inactive', 'Inactive')}
                                            onChange={() => form.setData('is_active', '0')}
                                        />
                                    </div>
                                    {form.errors.is_active && (
                                        <p className="mt-2 text-xs font-medium text-rose-600">
                                            {form.errors.is_active}
                                        </p>
                                    )}
                                </div>


                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        label={t('backoffice.store_branches.form.fields.timezone', 'Timezone')}
                                        value={form.data.timezone}
                                        onChange={(value) => form.setData('timezone', value)}
                                        error={form.errors.timezone}
                                    />
                                    <FormField
                                        label={t('backoffice.store_branches.form.fields.city', 'City')}
                                        value={form.data.city}
                                        onChange={(value) => form.setData('city', value)}
                                        error={form.errors.city}
                                    />
                                    <FormField
                                        label={t('backoffice.store_branches.form.fields.street', 'Street')}
                                        value={form.data.street}
                                        onChange={(value) => form.setData('street', value)}
                                        error={form.errors.street}
                                    />
                                    <FormField
                                        label={t('backoffice.store_branches.form.fields.district', 'District')}
                                        value={form.data.district}
                                        onChange={(value) => form.setData('district', value)}
                                        error={form.errors.district}
                                    />
                                    <FormField
                                        label={t('backoffice.store_branches.form.fields.province', 'Province')}
                                        value={form.data.province}
                                        onChange={(value) => form.setData('province', value)}
                                        error={form.errors.province}
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-blue-950">
                                        {t('backoffice.store_branches.form.fields.detail_address', 'Detail Address')}
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={form.data.detail_address}
                                        onChange={(event) =>
                                            form.setData('detail_address', event.target.value)
                                        }
                                        className="w-full rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                                    />
                                    {form.errors.detail_address && (
                                        <p className="mt-2 text-xs font-medium text-rose-600">
                                            {form.errors.detail_address}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {isEditing
                                            ? t('backoffice.store_branches.form.buttons.update', 'Update Branch')
                                            : t('backoffice.store_branches.form.buttons.create', 'Create Branch')}
                                    </button>

                                    <Link
                                        href={route('backoffice.store-branches.index')}
                                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        {t('backoffice.store_branches.form.buttons.cancel', 'Cancel')}
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

function FormField({ label, required = false, error, onChange, ...props }) {
    return (
        <div>
            <label className="block mb-2 text-sm font-semibold text-blue-950">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <input
                {...props}
                onChange={(event) => onChange?.(event.target.value)}
                className="w-full rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
            />
            {error && (
                <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>
            )}
        </div>
    );
}

function SelectField({
    label,
    required = false,
    error,
    onChange,
    children,
    ...props
}) {
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

function RadioCard({ checked, label, onChange }) {
    return (
        <label
            className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition ${checked
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-blue-100 bg-white text-slate-600 hover:bg-blue-50/40'
                }`}
        >
            <input
                type="radio"
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 text-blue-700 border-blue-300 focus:ring-blue-500"
            />
            <span>{label}</span>
        </label>
    );
}
