"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, AlertCircle, Info, CheckCircle } from "lucide-react"

interface AIAssistantProps {
  description: string
  onSuggestionApply?: (field: "category" | "ministry" | "description", value: string) => void
  isLoggedIn?: boolean
}

interface AISuggestions {
  category?: string
  ministry?: string
  suggestions?: string[]
  improvedDescription?: string
}

export function AIAssistant({ description, onSuggestionApply, isLoggedIn = false }: AIAssistantProps) {
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debouncedDescription, setDebouncedDescription] = useState(description)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())

  // Debounce description changes to prevent repeated API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDescription(description)
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [description])

  // Auto-analyze when debounced description changes and user is logged in
  useEffect(() => {
    if (isLoggedIn && debouncedDescription && debouncedDescription.length >= 20) {
      handleAnalyze()
    }
  }, [debouncedDescription])

  const handleAnalyze = useCallback(async () => {
    if (!debouncedDescription || debouncedDescription.length < 20) {
      setError("Please provide at least 20 characters for analysis")
      return
    }

    if (!isLoggedIn) {
      setError("Please log in to use the AI assistant")
      return
    }

    setLoading(true)
    setError(null)
    setSuggestions(null)

    try {
      const response = await fetch("/api/ai/analyze-complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: debouncedDescription }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Analysis failed")
      }

      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to analyze complaint")
    } finally {
      setLoading(false)
    }
  }, [debouncedDescription, isLoggedIn])

  const handleApplySuggestion = useCallback((field: "category" | "ministry" | "description", value: string) => {
    if (onSuggestionApply) {
      onSuggestionApply(field, value)
      setAppliedSuggestions(prev => new Set(prev).add(`${field}-${value}`))
    }
  }, [onSuggestionApply])

  const handleManualAnalyze = () => {
    setDebouncedDescription(description)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          AI Complaint Assistant
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions to improve your complaint
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleManualAnalyze}
          disabled={!isLoggedIn || loading || description.length < 20}
          className="w-full"
          aria-label={isLoggedIn ? "Analyze complaint with AI" : "Login required to use AI assistant"}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
              Analyze My Complaint
            </>
          )}
        </Button>

        {!isLoggedIn && (
          <div 
            className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2"
            role="alert"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>Please log in to use the AI assistant</span>
          </div>
        )}

        {error && (
          <div 
            className="text-sm text-destructive text-center p-2 border border-destructive/20 rounded-md"
            role="alert"
          >
            {error}
          </div>
        )}

        {suggestions && (
          <div className="space-y-4" role="region" aria-label="AI suggestions">
            {/* Category Suggestion */}
            {suggestions.category && (
              <div className="p-3 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">Suggested Category</div>
                    <div className="group relative inline-block">
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        AI-recommended category for your complaint
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplySuggestion("category", suggestions.category!)}
                    disabled={appliedSuggestions.has(`category-${suggestions.category}`)}
                    aria-label={`Apply category: ${suggestions.category}`}
                  >
                    {appliedSuggestions.has(`category-${suggestions.category}`) ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Applied
                      </>
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
                <Badge variant="secondary" aria-label={`Category: ${suggestions.category}`}>
                  {suggestions.category}
                </Badge>
              </div>
            )}

            {/* Ministry Suggestion */}
            {suggestions.ministry && (
              <div className="p-3 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">Suggested Ministry</div>
                    <div className="group relative inline-block">
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        AI-recommended ministry responsible for your complaint
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplySuggestion("ministry", suggestions.ministry!)}
                    disabled={appliedSuggestions.has(`ministry-${suggestions.ministry}`)}
                    aria-label={`Apply ministry: ${suggestions.ministry}`}
                  >
                    {appliedSuggestions.has(`ministry-${suggestions.ministry}`) ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Applied
                      </>
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
                <Badge variant="secondary" aria-label={`Ministry: ${suggestions.ministry}`}>
                  {suggestions.ministry}
                </Badge>
              </div>
            )}

            {/* Improved Description */}
            {suggestions.improvedDescription && suggestions.improvedDescription !== description && (
              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-medium text-sm">Improved Description</div>
                  <div className="group relative inline-block">
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      AI-enhanced version of your complaint for better clarity
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-2 p-2 bg-muted/50 rounded">
                  {suggestions.improvedDescription}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplySuggestion("description", suggestions.improvedDescription!)}
                  disabled={appliedSuggestions.has(`description-${suggestions.improvedDescription}`)}
                  aria-label="Use improved description"
                  className="w-full"
                >
                  {appliedSuggestions.has(`description-${suggestions.improvedDescription}`) ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Using This Description
                    </>
                  ) : (
                    "Use This Description"
                  )}
                </Button>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.suggestions && suggestions.suggestions.length > 0 && (
              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-medium text-sm">Clarity Suggestions</div>
                  <div className="group relative inline-block">
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Tips to make your complaint more effective
                    </div>
                  </div>
                </div>
                <ul className="space-y-1" role="list">
                  {suggestions.suggestions.map((suggestion, index) => (
                    <li 
                      key={index} 
                      className="text-sm text-muted-foreground flex items-start gap-2"
                      role="listitem"
                    >
                      <span className="text-primary mt-0.5" aria-hidden="true">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {isLoggedIn && description.length >= 20 && !loading && !suggestions && !error && (
          <div className="text-xs text-muted-foreground text-center">
            AI will automatically analyze your complaint as you type
          </div>
        )}
      </CardContent>
    </Card>
  )
}
