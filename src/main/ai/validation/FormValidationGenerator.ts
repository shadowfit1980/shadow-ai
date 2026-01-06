/**
 * Form Validation Generator
 * 
 * Generate form validation schemas for Zod, Yup, Valibot,
 * React Hook Form, and Flutter.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type ValidationLibrary = 'zod' | 'yup' | 'valibot' | 'joi';

export interface FieldDefinition {
    name: string;
    type: 'string' | 'email' | 'password' | 'number' | 'boolean' | 'date' | 'url' | 'phone';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
}

// ============================================================================
// FORM VALIDATION GENERATOR
// ============================================================================

export class FormValidationGenerator extends EventEmitter {
    private static instance: FormValidationGenerator;

    private constructor() {
        super();
    }

    static getInstance(): FormValidationGenerator {
        if (!FormValidationGenerator.instance) {
            FormValidationGenerator.instance = new FormValidationGenerator();
        }
        return FormValidationGenerator.instance;
    }

    // ========================================================================
    // ZOD
    // ========================================================================

    generateZodSchema(fields: FieldDefinition[], schemaName: string): string {
        const fieldSchemas = fields.map(field => {
            let schema = this.getZodType(field);
            return `  ${field.name}: ${schema},`;
        }).join('\n');

        return `import { z } from 'zod';

export const ${schemaName}Schema = z.object({
${fieldSchemas}
});

export type ${schemaName} = z.infer<typeof ${schemaName}Schema>;

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const phoneSchema = z
  .string()
  .regex(/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone number');

export const urlSchema = z.string().url('Invalid URL');

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Registration schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Contact form schema
export const contactSchema = z.object({
  name: z.string().min(2),
  email: emailSchema,
  subject: z.string().min(5),
  message: z.string().min(10).max(1000),
});

// Profile update schema
export const profileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  website: urlSchema.optional().or(z.literal('')),
  avatar: z.string().url().optional(),
});
`;
    }

    private getZodType(field: FieldDefinition): string {
        let schema = '';

        switch (field.type) {
            case 'string':
                schema = 'z.string()';
                if (field.min) schema += `.min(${field.min}, '${field.message || `Minimum ${field.min} characters`}')`;
                if (field.max) schema += `.max(${field.max}, '${field.message || `Maximum ${field.max} characters`}')`;
                if (field.pattern) schema += `.regex(/${field.pattern}/, '${field.message || 'Invalid format'}')`;
                break;
            case 'email':
                schema = "z.string().email('Invalid email')";
                break;
            case 'password':
                schema = "z.string().min(8, 'Password must be at least 8 characters')";
                break;
            case 'number':
                schema = 'z.number()';
                if (field.min !== undefined) schema += `.min(${field.min})`;
                if (field.max !== undefined) schema += `.max(${field.max})`;
                break;
            case 'boolean':
                schema = 'z.boolean()';
                break;
            case 'date':
                schema = 'z.date()';
                break;
            case 'url':
                schema = "z.string().url('Invalid URL')";
                break;
            case 'phone':
                schema = "z.string().regex(/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone')";
                break;
            default:
                schema = 'z.string()';
        }

        if (!field.required) {
            schema += '.optional()';
        }

        return schema;
    }

    // ========================================================================
    // REACT HOOK FORM + ZOD
    // ========================================================================

    generateReactHookForm(): string {
        return `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema
const formSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Component
export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      console.log('Form data:', data);
      // Submit to API
      reset();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p role="alert">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p role="alert">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('rememberMe')} />
          Remember me
        </label>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Login'}
      </button>
    </form>
  );
}

// Custom Input component
interface InputProps {
  label: string;
  name: string;
  type?: string;
  error?: string;
  register: any;
}

export function Input({ label, name, type = 'text', error, register }: InputProps) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        {...register(name)}
        className={error ? 'error' : ''}
        aria-invalid={!!error}
        aria-describedby={error ? \`\${name}-error\` : undefined}
      />
      {error && (
        <p id={\`\${name}-error\`} className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// useFormField hook
export function useFormField<T extends z.ZodType>(schema: T) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
  });
}
`;
    }

    // ========================================================================
    // YUP
    // ========================================================================

    generateYupSchema(fields: FieldDefinition[], schemaName: string): string {
        const fieldSchemas = fields.map(field => {
            let schema = this.getYupType(field);
            return `  ${field.name}: ${schema},`;
        }).join('\n');

        return `import * as yup from 'yup';

export const ${schemaName}Schema = yup.object({
${fieldSchemas}
});

export type ${schemaName} = yup.InferType<typeof ${schemaName}Schema>;

// Common schemas
export const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
});

export const registerSchema = yup.object({
  name: yup.string().min(2).required(),
  email: yup.string().email().required(),
  password: yup
    .string()
    .min(8)
    .matches(/[A-Z]/, 'Must contain uppercase')
    .matches(/[0-9]/, 'Must contain number')
    .required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required(),
});
`;
    }

    private getYupType(field: FieldDefinition): string {
        let schema = '';

        switch (field.type) {
            case 'string':
                schema = 'yup.string()';
                break;
            case 'email':
                schema = "yup.string().email('Invalid email')";
                break;
            case 'password':
                schema = 'yup.string().min(8)';
                break;
            case 'number':
                schema = 'yup.number()';
                break;
            case 'boolean':
                schema = 'yup.boolean()';
                break;
            case 'date':
                schema = 'yup.date()';
                break;
            default:
                schema = 'yup.string()';
        }

        if (field.required) {
            schema += ".required('This field is required')";
        }

        return schema;
    }

    // ========================================================================
    // FLUTTER
    // ========================================================================

    generateFlutterValidation(): string {
        return `// Flutter Form Validation
import 'package:flutter/material.dart';

// Validators
class Validators {
  static String? required(String? value, [String? message]) {
    if (value == null || value.isEmpty) {
      return message ?? 'This field is required';
    }
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.isEmpty) return null;
    
    final emailRegex = RegExp(r'^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Invalid email address';
    }
    return null;
  }

  static String? minLength(String? value, int min) {
    if (value == null || value.isEmpty) return null;
    
    if (value.length < min) {
      return 'Must be at least \$min characters';
    }
    return null;
  }

  static String? maxLength(String? value, int max) {
    if (value == null || value.isEmpty) return null;
    
    if (value.length > max) {
      return 'Must be at most \$max characters';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return null;
    
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!value.contains(RegExp(r'[A-Z]'))) return 'Must contain uppercase letter';
    if (!value.contains(RegExp(r'[a-z]'))) return 'Must contain lowercase letter';
    if (!value.contains(RegExp(r'[0-9]'))) return 'Must contain number';
    
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.isEmpty) return null;
    
    final phoneRegex = RegExp(r'^\\+?[1-9]\\d{1,14}$');
    if (!phoneRegex.hasMatch(value)) {
      return 'Invalid phone number';
    }
    return null;
  }

  static String? url(String? value) {
    if (value == null || value.isEmpty) return null;
    
    final urlRegex = RegExp(
      r'^https?:\\/\\/[\\w-]+(\\.[\\w-]+)+[/#?]?.*$',
      caseSensitive: false,
    );
    if (!urlRegex.hasMatch(value)) {
      return 'Invalid URL';
    }
    return null;
  }

  static String? match(String? value, String other, [String? message]) {
    if (value != other) {
      return message ?? 'Values do not match';
    }
    return null;
  }

  // Combine validators
  static FormFieldValidator<String> compose(List<FormFieldValidator<String>> validators) {
    return (value) {
      for (final validator in validators) {
        final error = validator(value);
        if (error != null) return error;
      }
      return null;
    };
  }
}

// Form Widget Example
class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Submit form
      print('Email: \${_emailController.text}');
      print('Password: \${_passwordController.text}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(labelText: 'Email'),
            keyboardType: TextInputType.emailAddress,
            validator: Validators.compose([
              (v) => Validators.required(v, 'Email is required'),
              Validators.email,
            ]),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _passwordController,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
            validator: Validators.compose([
              (v) => Validators.required(v, 'Password is required'),
              Validators.password,
            ]),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _isLoading ? null : _submit,
            child: _isLoading
                ? const CircularProgressIndicator()
                : const Text('Login'),
          ),
        ],
      ),
    );
  }
}

// Reusable Form Field
class ValidatedTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final FormFieldValidator<String>? validator;
  final bool obscureText;
  final TextInputType? keyboardType;

  const ValidatedTextField({
    super.key,
    required this.controller,
    required this.label,
    this.validator,
    this.obscureText = false,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      obscureText: obscureText,
      keyboardType: keyboardType,
      validator: validator,
      autovalidateMode: AutovalidateMode.onUserInteraction,
    );
  }
}
`;
    }
}

export const formValidationGenerator = FormValidationGenerator.getInstance();
