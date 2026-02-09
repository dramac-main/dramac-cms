// AI Module Builder Page
// Phase EM-23: AI-powered module generation from natural language

import { Metadata } from 'next';
import { AIModuleBuilder } from '@/components/modules/AIModuleBuilder';
import { PLATFORM } from '@/lib/constants/platform';

export const metadata: Metadata = {
  title: `AI Module Builder | ${PLATFORM.name} Studio`,
  description: 'Build modules from natural language descriptions using AI',
};

export default function AIBuilderPage() {
  return (
    <div className="container mx-auto py-6">
      <AIModuleBuilder />
    </div>
  );
}
