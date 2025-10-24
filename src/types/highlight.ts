export interface CreateHighlightRequest {
  id: string
  articleId: string
  location: string
  html: string
  markdown: string
  plainText: string
  color: string | undefined
  createAt: number
  createBy: "rehi-browser-extension"
}

export interface SelectionData {
  location: string
  text: string
  html: string
  markdown: string
  startArrayPath: number[]
  endArrayPath: number[]
  startStringPath: string
  endStringPath: string
}

// Additional types for highlight application
export interface TextMapEntry {
  node: Text
  start: number
  end: number
}

export interface MatchPosition {
  map: TextMapEntry[]
  startOffset: number
  endOffset: number
}

export interface HighlightData {
  id: string
  articleId: string
  location: string
  text: string
  html?: string
  markdown?: string
  color?: string
  createdAt: number
  updatedAt?: number
  createBy: "rehi-web" | "rehi-browser-extension"
  isDeleted: boolean
}
