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
