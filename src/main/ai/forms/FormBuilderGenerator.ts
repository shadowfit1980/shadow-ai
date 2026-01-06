/**
 * Form Builder Generator
 * 
 * Generate dynamic forms using React Hook Form, Formik,
 * and native HTML forms with validation.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type FormLibrary = 'react-hook-form' | 'formik' | 'native';
export type FieldType = 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'file';

export interface FormField {
    name: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required?: boolean;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        minLength?: number;
        maxLength?: number;
        custom?: string;
    };
    options?: Array<{ label: string; value: string | number }>;
    defaultValue?: any;
}

export interface FormConfig {
    name: string;
    fields: FormField[];
    submitLabel?: string;
    onSubmit?: string;
}

// ============================================================================
// FORM BUILDER GENERATOR
// ============================================================================

export class FormBuilderGenerator extends EventEmitter {
    private static instance: FormBuilderGenerator;

    private constructor() {
        super();
    }

    static getInstance(): FormBuilderGenerator {
        if (!FormBuilderGenerator.instance) {
            FormBuilderGenerator.instance = new FormBuilderGenerator();
        }
        return FormBuilderGenerator.instance;
    }

    // ========================================================================
    // REACT HOOK FORM
    // ========================================================================

    generateReactHookForm(config: FormConfig): string {
        return `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const ${config.name}Schema = z.object({
${config.fields.map(field => this.generateZodValidation(field)).join(',\n')}
});

type ${this.capitalize(config.name)}FormData = z.infer<typeof ${config.name}Schema>;

// ============================================================================
// FORM COMPONENT
// ============================================================================

export function ${this.capitalize(config.name)}Form() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<${this.capitalize(config.name)}FormData>({
        resolver: zodResolver(${config.name}Schema),
        defaultValues: {
${config.fields.map(f => `            ${f.name}: ${JSON.stringify(f.defaultValue || '')},`).join('\n')}
        },
    });

    const onSubmit = async (data: ${this.capitalize(config.name)}FormData) => {
        try {
            console.log('Form data:', data);
            // TODO: Handle form submission
            ${config.onSubmit || '// await api.submit(data);'}
            reset();
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
${config.fields.map(field => this.generateReactHookFormField(field)).join('\n\n')}

            <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
            >
                {isSubmitting ? 'Submitting...' : '${config.submitLabel || 'Submit'}'}
            </button>
        </form>
    );
}
`;
    }

    private generateZodValidation(field: FormField): string {
        let schema = '';

        switch (field.type) {
            case 'email':
                schema = 'z.string().email()';
                break;
            case 'number':
                schema = 'z.number()';
                if (field.validation?.min !== undefined) schema += `.min(${field.validation.min})`;
                if (field.validation?.max !== undefined) schema += `.max(${field.validation.max})`;
                break;
            case 'checkbox':
                schema = 'z.boolean()';
                break;
            case 'date':
                schema = 'z.string().datetime()';
                break;
            default:
                schema = 'z.string()';
                if (field.validation?.minLength) schema += `.min(${field.validation.minLength})`;
                if (field.validation?.maxLength) schema += `.max(${field.validation.maxLength})`;
                if (field.validation?.pattern) schema += `.regex(/${field.validation.pattern}/)`;
        }

        if (!field.required) {
            schema += '.optional()';
        }

        return `    ${field.name}: ${schema}`;
    }

    private generateReactHookFormField(field: FormField): string {
        const errorMsg = `errors.${field.name}?.message`;

        switch (field.type) {
            case 'select':
                return `            <div>
                <label className="block text-sm font-medium mb-1">
                    ${field.label}
                </label>
                <select {...register('${field.name}')} className="input">
                    <option value="">Select...</option>
${field.options?.map(opt => `                    <option value="${opt.value}">${opt.label}</option>`).join('\n')}
                </select>
                {${errorMsg} && <p className="text-red-500 text-sm mt-1">{${errorMsg}}</p>}
            </div>`;

            case 'checkbox':
                return `            <div className="flex items-center">
                <input
                    type="checkbox"
                    {...register('${field.name}')}
                    className="checkbox"
                />
                <label className="ml-2">${field.label}</label>
                {${errorMsg} && <p className="text-red-500 text-sm mt-1">{${errorMsg}}</p>}
            </div>`;

            case 'textarea':
                return `            <div>
                <label className="block text-sm font-medium mb-1">
                    ${field.label}
                </label>
                <textarea
                    {...register('${field.name}')}
                    placeholder="${field.placeholder || ''}"
                    className="input"
                    rows={4}
                />
                {${errorMsg} && <p className="text-red-500 text-sm mt-1">{${errorMsg}}</p>}
            </div>`;

            default:
                return `            <div>
                <label className="block text-sm font-medium mb-1">
                    ${field.label}
                </label>
                <input
                    type="${field.type}"
                    {...register('${field.name}'${field.type === 'number' ? ', { valueAsNumber: true }' : ''})}
                    placeholder="${field.placeholder || ''}"
                    className="input"
                />
                {${errorMsg} && <p className="text-red-500 text-sm mt-1">{${errorMsg}}</p>}
            </div>`;
        }
    }

    // ========================================================================
    // FORMIK
    // ========================================================================

    generateFormik(config: FormConfig): string {
        return `import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const ${config.name}Schema = Yup.object().shape({
${config.fields.map(field => this.generateYupValidation(field)).join(',\n')}
});

// ============================================================================
// FORM COMPONENT
// ============================================================================

export function ${this.capitalize(config.name)}Form() {
    const initialValues = {
${config.fields.map(f => `        ${f.name}: ${JSON.stringify(f.defaultValue || '')},`).join('\n')}
    };

    const handleSubmit = async (values: typeof initialValues, { setSubmitting, resetForm }: any) => {
        try {
            console.log('Form data:', values);
            // TODO: Handle form submission
            ${config.onSubmit || '// await api.submit(values);'}
            resetForm();
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={${config.name}Schema}
            onSubmit={handleSubmit}
        >
            {({ isSubmitting }) => (
                <Form className="space-y-4">
${config.fields.map(field => this.generateFormikField(field)).join('\n\n')}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                    >
                        {isSubmitting ? 'Submitting...' : '${config.submitLabel || 'Submit'}'}
                    </button>
                </Form>
            )}
        </Formik>
    );
}
`;
    }

    private generateYupValidation(field: FormField): string {
        let schema = '';

        switch (field.type) {
            case 'email':
                schema = 'Yup.string().email("Invalid email")';
                break;
            case 'number':
                schema = 'Yup.number()';
                if (field.validation?.min !== undefined) schema += `.min(${field.validation.min})`;
                if (field.validation?.max !== undefined) schema += `.max(${field.validation.max})`;
                break;
            case 'checkbox':
                schema = 'Yup.boolean()';
                break;
            default:
                schema = 'Yup.string()';
                if (field.validation?.minLength) schema += `.min(${field.validation.minLength})`;
                if (field.validation?.maxLength) schema += `.max(${field.validation.maxLength})`;
        }

        if (field.required) {
            schema += '.required("This field is required")';
        }

        return `    ${field.name}: ${schema}`;
    }

    private generateFormikField(field: FormField): string {
        switch (field.type) {
            case 'select':
                return `                    <div>
                        <label className="block text-sm font-medium mb-1">
                            ${field.label}
                        </label>
                        <Field as="select" name="${field.name}" className="input">
                            <option value="">Select...</option>
${field.options?.map(opt => `                            <option value="${opt.value}">${opt.label}</option>`).join('\n')}
                        </Field>
                        <ErrorMessage name="${field.name}" component="div" className="text-red-500 text-sm mt-1" />
                    </div>`;

            case 'checkbox':
                return `                    <div className="flex items-center">
                        <Field type="checkbox" name="${field.name}" className="checkbox" />
                        <label className="ml-2">${field.label}</label>
                        <ErrorMessage name="${field.name}" component="div" className="text-red-500 text-sm mt-1" />
                    </div>`;

            case 'textarea':
                return `                    <div>
                        <label className="block text-sm font-medium mb-1">
                            ${field.label}
                        </label>
                        <Field
                            as="textarea"
                            name="${field.name}"
                            placeholder="${field.placeholder || ''}"
                            className="input"
                            rows={4}
                        />
                        <ErrorMessage name="${field.name}" component="div" className="text-red-500 text-sm mt-1" />
                    </div>`;

            default:
                return `                    <div>
                        <label className="block text-sm font-medium mb-1">
                            ${field.label}
                        </label>
                        <Field
                            type="${field.type}"
                            name="${field.name}"
                            placeholder="${field.placeholder || ''}"
                            className="input"
                        />
                        <ErrorMessage name="${field.name}" component="div" className="text-red-500 text-sm mt-1" />
                    </div>`;
        }
    }

    // ========================================================================
    // MULTI-STEP FORM
    // ========================================================================

    generateMultiStepForm(steps: Array<{ title: string; fields: FormField[] }>): string {
        return `import { useState } from 'react';
import { useForm } from 'react-hook-form';

export function MultiStepForm() {
    const [currentStep, setCurrentStep] = useState(0);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const steps = ${JSON.stringify(steps.map(s => ({ title: s.title, fields: s.fields.map(f => f.name) })), null, 4)};

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const onSubmit = (data: any) => {
        if (currentStep === steps.length - 1) {
            console.log('Final submission:', data);
            // Handle final submission
        } else {
            nextStep();
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress indicator */}
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={\`flex-1 text-center \${index === currentStep ? 'font-bold' : ''}\`}
                        >
                            {step.title}
                        </div>
                    ))}
                </div>
                <div className="h-2 bg-gray-200 rounded">
                    <div
                        className="h-full bg-blue-600 rounded transition-all"
                        style={{ width: \`\${((currentStep + 1) / steps.length) * 100}%\` }}
                    />
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Render current step fields */}
                {currentStep === 0 && (
                    <div className="space-y-4">
${steps[0]?.fields.map(f => `                        <div>
                            <label>${f.label}</label>
                            <input {...register('${f.name}')} className="input" />
                        </div>`).join('\n')}
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="btn btn-secondary"
                    >
                        Previous
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
                    </button>
                </div>
            </form>
        </div>
    );
}
`;
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

export const formBuilderGenerator = FormBuilderGenerator.getInstance();
