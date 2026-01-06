/**
 * Form Generator
 * 
 * Generate forms with React Hook Form, Formik, or plain React.
 */

import { EventEmitter } from 'events';

interface FormField {
    name: string;
    type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'textarea';
    label: string;
    required?: boolean;
    options?: string[]; // for select
    validation?: { min?: number; max?: number; pattern?: string };
}

export class FormGenerator extends EventEmitter {
    private static instance: FormGenerator;

    private constructor() { super(); }

    static getInstance(): FormGenerator {
        if (!FormGenerator.instance) {
            FormGenerator.instance = new FormGenerator();
        }
        return FormGenerator.instance;
    }

    generateReactHookForm(formName: string, fields: FormField[]): string {
        const fieldInputs = fields.map(f => this.renderRHFField(f)).join('\n\n');
        return `import { useForm } from 'react-hook-form';

interface ${formName}Data {
${fields.map(f => `  ${f.name}: ${this.getTypeForField(f)};`).join('\n')}
}

export function ${formName}() {
  const { register, handleSubmit, formState: { errors } } = useForm<${formName}Data>();

  const onSubmit = (data: ${formName}Data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
${fieldInputs}
      <button type="submit">Submit</button>
    </form>
  );
}
`;
    }

    private renderRHFField(field: FormField): string {
        const validation = field.required ? `{ required: '${field.label} is required' }` : '{}';
        if (field.type === 'select') {
            return `      <div>
        <label>{${field.label}}</label>
        <select {...register('${field.name}', ${validation})}>
${field.options?.map(o => `          <option value="${o}">${o}</option>`).join('\n')}
        </select>
        {errors.${field.name} && <span>{errors.${field.name}?.message}</span>}
      </div>`;
        }
        if (field.type === 'textarea') {
            return `      <div>
        <label>${field.label}</label>
        <textarea {...register('${field.name}', ${validation})} />
        {errors.${field.name} && <span>{errors.${field.name}?.message}</span>}
      </div>`;
        }
        if (field.type === 'checkbox') {
            return `      <div>
        <label><input type="checkbox" {...register('${field.name}')} /> ${field.label}</label>
      </div>`;
        }
        return `      <div>
        <label>${field.label}</label>
        <input type="${field.type}" {...register('${field.name}', ${validation})} />
        {errors.${field.name} && <span>{errors.${field.name}?.message}</span>}
      </div>`;
    }

    private getTypeForField(field: FormField): string {
        if (field.type === 'number') return 'number';
        if (field.type === 'checkbox') return 'boolean';
        return 'string';
    }

    generateFormik(formName: string, fields: FormField[]): string {
        const initialValues = fields.map(f => `${f.name}: ''`).join(', ');
        return `import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const ${formName}Schema = Yup.object({
${fields.filter(f => f.required).map(f => `  ${f.name}: Yup.string().required('${f.label} is required'),`).join('\n')}
});

export function ${formName}() {
  return (
    <Formik
      initialValues={{ ${initialValues} }}
      validationSchema={${formName}Schema}
      onSubmit={(values) => console.log(values)}
    >
      <Form>
${fields.map(f => `        <div>
          <label>${f.label}</label>
          <Field name="${f.name}" type="${f.type}" />
          <ErrorMessage name="${f.name}" component="span" />
        </div>`).join('\n')}
        <button type="submit">Submit</button>
      </Form>
    </Formik>
  );
}
`;
    }

    generateZodSchema(fields: FormField[]): string {
        const schema = fields.map(f => {
            let s = `${f.name}: z.string()`;
            if (f.type === 'email') s = `${f.name}: z.string().email()`;
            if (f.type === 'number') s = `${f.name}: z.number()`;
            if (f.required) s += '.min(1)';
            return `  ${s},`;
        }).join('\n');
        return `import { z } from 'zod';\n\nexport const formSchema = z.object({\n${schema}\n});\n\nexport type FormData = z.infer<typeof formSchema>;`;
    }
}

export const formGenerator = FormGenerator.getInstance();
