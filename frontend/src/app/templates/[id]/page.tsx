"use client"

import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { ProtectedRoute } from "../../../components/auth/protected-route"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { ArrowLeft, Github, ExternalLink, Copy, CheckCircle, Play, Code } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"

interface ConversionStep {
  step_number: number
  title: string
  description: string
  command?: string
}

interface Template {
  id: string
  name: string
  description: string
  source_repo_name: string
  source_repo_url: string
  tags: string[]
  created_at: string
  conversion_steps: ConversionStep[]
  setup_commands: string[]
  files_to_modify: string[]
  tech_stack: string[]
}

interface TemplateApiResponse {
  id: string
  name: string
  description?: string
  source_repo_name: string
  source_repo_url: string
  tags?: string[]
  created_at: string
  template_data?: Record<string, unknown>
  analysis_results?: Record<string, unknown>
}

export default function TemplateDetailsPage() {
  const { user } = useUser()
  const params = useParams()
  const templateId = params.id as string
  
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedStep, setCopiedStep] = useState<number | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  const extractConversionSteps = (templateData: TemplateApiResponse): ConversionStep[] => {
    // Try to extract from analysis_results or template_data
    const analysisResults = templateData.analysis_results || {}
    const templateDataObj = templateData.template_data || {}
    
    // Look for conversion steps in various possible locations
    if (analysisResults.conversion_steps && Array.isArray(analysisResults.conversion_steps)) {
      return analysisResults.conversion_steps.map((step: unknown, index: number) => {
        const stepObj = step as Record<string, unknown>
        return {
          step_number: index + 1,
          title: (stepObj.title as string) || `Step ${index + 1}`,
          description: (stepObj.description as string) || (stepObj.content as string) || String(step),
          command: stepObj.command as string | undefined
        }
      })
    }
    
    if (templateDataObj.steps && Array.isArray(templateDataObj.steps)) {
      return templateDataObj.steps.map((step: unknown, index: number) => {
        const stepObj = step as Record<string, unknown>
        return {
          step_number: index + 1,
          title: (stepObj.title as string) || `Step ${index + 1}`,
          description: (stepObj.description as string) || String(step),
          command: stepObj.command as string | undefined
        }
      })
    }
    
    // Fallback: create generic steps
    return [
      {
        step_number: 1,
        title: "Clone the Repository",
        description: `Clone the source repository: ${templateData.source_repo_url}`,
        command: `git clone ${templateData.source_repo_url}`
      },
      {
        step_number: 2,
        title: "Install Dependencies",
        description: "Install the required dependencies for the project",
        command: "npm install"
      },
      {
        step_number: 3,
        title: "Customize the Template",
        description: "Modify the template files according to your project needs"
      }
    ]
  }

  const extractSetupCommands = (templateData: TemplateApiResponse): string[] => {
    const analysisResults = templateData.analysis_results || {}
    if (analysisResults.setup_commands && Array.isArray(analysisResults.setup_commands)) {
      return analysisResults.setup_commands as string[]
    }
    
    return [
      `git clone ${templateData.source_repo_url}`,
      "npm install",
      "npm run dev"
    ]
  }

  const extractFilesToModify = (templateData: TemplateApiResponse): string[] => {
    const analysisResults = templateData.analysis_results || {}
    if (analysisResults.files_to_modify && Array.isArray(analysisResults.files_to_modify)) {
      return analysisResults.files_to_modify as string[]
    }
    
    return [
      "package.json",
      "README.md",
      "src/components/",
      "public/"
    ]
  }

  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { api } = await import('../../../lib/api')
      
      const templateData = await api.getTemplate(templateId) as TemplateApiResponse
      
      // Transform the data to match our expected format
      const transformedTemplate: Template = {
        id: templateData.id,
        name: templateData.name,
        description: templateData.description || `Template converted from ${templateData.source_repo_name}`,
        source_repo_name: templateData.source_repo_name,
        source_repo_url: templateData.source_repo_url,
        tags: templateData.tags || [],
        created_at: templateData.created_at,
        conversion_steps: extractConversionSteps(templateData),
        setup_commands: extractSetupCommands(templateData),
        files_to_modify: extractFilesToModify(templateData),
        tech_stack: templateData.tags || []
      }
      
      setTemplate(transformedTemplate)
      
    } catch (err) {
      console.error('Error fetching template:', err)
      setError('Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    if (user && templateId) {
      fetchTemplate()
    }
  }, [user, templateId, fetchTemplate])

  const generateLLMPrompt = (): string => {
    if (!template) return ""
    
    return `# Template Conversion Guide: ${template.name}

## Source Repository
- **Repository**: ${template.source_repo_name}
- **URL**: ${template.source_repo_url}
- **Description**: ${template.description}

## Tech Stack
${template.tech_stack.map(tech => `- ${tech}`).join('\n')}

## Setup Commands
\`\`\`bash
${template.setup_commands.join('\n')}
\`\`\`

## Conversion Steps

${template.conversion_steps.map(step => 
  `### ${step.step_number}. ${step.title}
${step.description}${step.command ? `\n\n\`\`\`bash\n${step.command}\n\`\`\`` : ''}`
).join('\n\n')}

## Files to Modify
${template.files_to_modify.map(file => `- ${file}`).join('\n')}

## Instructions for AI
Please help me convert this template for my specific project needs. I want to:
1. Understand the project structure
2. Customize it for my use case
3. Update dependencies and configurations as needed
4. Modify the styling and components to match my design requirements

Please provide specific guidance on how to adapt this template while maintaining its core functionality.`
  }

  const copyToClipboard = async (text: string, type: 'step' | 'prompt', stepNumber?: number) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'step' && stepNumber) {
        setCopiedStep(stepNumber)
        setTimeout(() => setCopiedStep(null), 2000)
      } else if (type === 'prompt') {
        setCopiedPrompt(true)
        setTimeout(() => setCopiedPrompt(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-8 p-4">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4" />
              <div className="h-6 bg-muted rounded w-1/2 mb-8" />
              <div className="grid gap-6">
                <div className="h-40 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
                <div className="h-48 bg-muted rounded" />
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !template) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-8 p-4">
            <div className="flex items-center space-x-4">
              <Link href="/templates">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Templates
                </Button>
              </Link>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center min-h-[400px]"
            >
              <Card className="border-destructive/50 bg-destructive/5 max-w-md w-full">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium mb-2">Template Not Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {error || 'The template you are looking for does not exist or you do not have access to it.'}
                    </p>
                    <Link href="/templates">
                      <Button>Back to Templates</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8 p-4 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-4 min-w-0">
              <Link href="/templates">
                <Button variant="outline" size="sm" className="gap-2 shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Templates
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">{template.name}</h1>
                <p className="text-muted-foreground text-sm sm:text-base truncate">
                  From {template.source_repo_name}
                </p>
              </div>
            </div>
            <a 
              href={template.source_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant="outline" className="gap-2">
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">View Source</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 shrink-0" />
                      Template Overview
                    </CardTitle>
                    <CardDescription>
                      AI-generated conversion guide for this repository
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-muted-foreground leading-relaxed">
                        {template.description}
                      </p>
                    </div>
                    {template.tech_stack.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Tech Stack</h4>
                        <div className="flex flex-wrap gap-2">
                          {template.tech_stack.map((tech) => (
                            <span
                              key={tech}
                              className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Conversion Steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5 shrink-0" />
                      Conversion Steps
                    </CardTitle>
                    <CardDescription>
                      Follow these steps to convert this template for your project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {template.conversion_steps.map((step, index) => (
                      <motion.div
                        key={step.step_number}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium shrink-0 mt-0.5">
                              {step.step_number}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium leading-tight">{step.title}</h4>
                            </div>
                          </div>
                          <div className="ml-9">
                            <p className="text-muted-foreground leading-relaxed mb-3">
                              {step.description}
                            </p>
                            {step.command && (
                              <div className="bg-muted rounded-md p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <pre className="font-mono text-sm overflow-x-auto flex-1 whitespace-pre-wrap break-all">
                                    <code>{step.command}</code>
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(step.command!, 'step', step.step_number)}
                                    className="shrink-0"
                                  >
                                    {copiedStep === step.step_number ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* LLM Prompt */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="min-w-0">
                        <CardTitle className="leading-tight">
                          AI Assistant Prompt
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Copy this prompt to ask an AI assistant for help with this template
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(generateLLMPrompt(), 'prompt')}
                        className="shrink-0 gap-2"
                      >
                        {copiedPrompt ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Prompt
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap max-h-96 leading-relaxed">
                        <code>{generateLLMPrompt()}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Setup */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Quick Setup</CardTitle>
                    <CardDescription>
                      Run these commands to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {template.setup_commands.map((command, index) => (
                      <div key={index} className="bg-muted rounded-md p-3">
                        <div className="flex items-start justify-between gap-3">
                          <pre className="font-mono text-sm overflow-x-auto flex-1 whitespace-pre-wrap break-all">
                            <code>{command}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(command, 'step')}
                            className="shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Files to Modify */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Key Files</CardTitle>
                    <CardDescription>
                      Files you&apos;ll likely need to modify
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {template.files_to_modify.map((file, index) => (
                        <li key={index} className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                          <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                            {file}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 