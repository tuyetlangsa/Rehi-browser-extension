export interface GetOrAddDocumentRequest {
  id: string
  url: string
  rawHtml: string
  title: string
  createAt: number
}

export interface GetOrAddDocumentResponse {
  id: string
  url: string
  isSavedBefore: boolean
  highlights: HighlightResponse[]
}

export interface HighlightResponse {
  id: string
  articleId: string
  location: string
  html: string
  markdown: string
  plainText: string
  createAt: number
  updateAt: number | null
  color: string | null
}
