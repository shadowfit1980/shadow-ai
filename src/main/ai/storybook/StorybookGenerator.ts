// Storybook Generator - Generate Storybook stories for React components
import Anthropic from '@anthropic-ai/sdk';

interface ComponentMeta {
    componentName: string;
    componentPath: string;
    props: Array<{
        name: string;
        type: string;
        required: boolean;
        defaultValue?: unknown;
        description?: string;
    }>;
}

class StorybookGenerator {
    private anthropic: Anthropic | null = null;

    private getClient(): Anthropic {
        if (!this.anthropic) {
            this.anthropic = new Anthropic();
        }
        return this.anthropic;
    }

    generateStory(meta: ComponentMeta): string {
        const propArgs = meta.props.map(p => {
            let control = 'text';
            if (p.type.includes('boolean')) control = 'boolean';
            else if (p.type.includes('number')) control = 'number';
            else if (p.type.includes('|')) control = 'select';

            return `    ${p.name}: {
      control: '${control}',
      description: '${p.description || p.name}',
      ${p.defaultValue !== undefined ? `defaultValue: ${JSON.stringify(p.defaultValue)},` : ''}
    },`;
        }).join('\n');

        return `import type { Meta, StoryObj } from '@storybook/react';
import { ${meta.componentName} } from '${meta.componentPath}';

const meta: Meta<typeof ${meta.componentName}> = {
  title: 'Components/${meta.componentName}',
  component: ${meta.componentName},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '${meta.componentName} component documentation',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
${propArgs}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
${meta.props.filter(p => p.required).map(p => `    ${p.name}: ${JSON.stringify(p.defaultValue || getDefaultForType(p.type))},`).join('\n')}
  },
};

export const Playground: Story = {
  args: {
${meta.props.map(p => `    ${p.name}: ${JSON.stringify(p.defaultValue || getDefaultForType(p.type))},`).join('\n')}
  },
};

function getDefaultForType(type: string): unknown {
  if (type.includes('string')) return 'Sample Text';
  if (type.includes('number')) return 0;
  if (type.includes('boolean')) return false;
  if (type.includes('[]')) return [];
  return null;
}
`;
    }

    generateStorybookConfig(): string {
        return `import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};

export default config;
`;
    }

    generatePreviewConfig(): string {
        return `import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a2e' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' } },
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
`;
    }

    generateInteractionTest(componentName: string): string {
        return `import { within, userEvent, expect } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from './${componentName}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInteractions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find interactive elements
    const button = canvas.getByRole('button');
    
    // Interact with elements
    await userEvent.click(button);
    
    // Assert expected outcomes
    await expect(canvas.getByText('Expected Text')).toBeInTheDocument();
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard navigation
    await userEvent.tab();
    await expect(canvas.getByRole('button')).toHaveFocus();
    
    await userEvent.keyboard('{Enter}');
  },
};
`;
    }
}

function getDefaultForType(type: string): unknown {
    if (type.includes('string')) return 'Sample Text';
    if (type.includes('number')) return 0;
    if (type.includes('boolean')) return false;
    if (type.includes('[]')) return [];
    return null;
}

export const storybookGenerator = new StorybookGenerator();
