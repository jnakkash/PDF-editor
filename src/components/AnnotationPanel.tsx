import React, { useState, useCallback } from 'react'
import { AnnotationElement, Comment, PDFDocument } from '../types'

interface AnnotationPanelProps {
  isOpen: boolean
  onClose: () => void
  document: PDFDocument
  annotations: AnnotationElement[]
  comments: Comment[]
  onCreateAnnotation: (annotation: Omit<AnnotationElement, 'id'>) => void
  onUpdateAnnotation: (id: string, updates: Partial<AnnotationElement>) => void
  onDeleteAnnotation: (id: string) => void
  onCreateComment: (comment: Omit<Comment, 'id'>) => void
  onUpdateComment: (id: string, updates: Partial<Comment>) => void
  onDeleteComment: (id: string) => void
  onHighlightAnnotation: (id: string) => void
  currentUser: string
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  isOpen,
  onClose,
  document,
  annotations,
  comments,
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onHighlightAnnotation,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'annotations' | 'comments'>('annotations')
  const [selectedAnnotationType, setSelectedAnnotationType] = useState<AnnotationElement['annotationType']>('highlight')
  const [newCommentContent, setNewCommentContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [filterResolved, setFilterResolved] = useState(false)

  const annotationTypes = [
    { id: 'highlight', name: 'Highlight', icon: '🖍️', color: '#ffeb3b' },
    { id: 'note', name: 'Sticky Note', icon: '📝', color: '#fff59d' },
    { id: 'stamp', name: 'Stamp', icon: '🏷️', color: '#f44336' },
    { id: 'freehand', name: 'Freehand', icon: '✏️', color: '#2196f3' },
    { id: 'callout', name: 'Callout', icon: '💬', color: '#4caf50' },
    { id: 'arrow', name: 'Arrow', icon: '➡️', color: '#ff9800' }
  ] as const

  const stampTypes = [
    { id: 'approved', name: 'Approved', color: '#4caf50' },
    { id: 'rejected', name: 'Rejected', color: '#f44336' },
    { id: 'draft', name: 'Draft', color: '#ff9800' },
    { id: 'confidential', name: 'Confidential', color: '#9c27b0' },
    { id: 'custom', name: 'Custom', color: '#607d8b' }
  ] as const

  const handleCreateComment = useCallback(() => {
    if (!newCommentContent.trim()) return

    const newComment: Omit<Comment, 'id'> = {
      parentId: replyingTo || undefined,
      pageNumber: 1, // TODO: Get current page
      x: 100, // TODO: Get position from click
      y: 100,
      content: newCommentContent.trim(),
      author: currentUser,
      createdAt: new Date(),
      modifiedAt: new Date(),
      resolved: false
    }

    onCreateComment(newComment)
    setNewCommentContent('')
    setReplyingTo(null)
  }, [newCommentContent, replyingTo, currentUser, onCreateComment])

  const handleResolveComment = useCallback((commentId: string, resolved: boolean) => {
    onUpdateComment(commentId, { resolved, modifiedAt: new Date() })
  }, [onUpdateComment])

  const getAnnotationIcon = (type: AnnotationElement['annotationType']) => {
    return annotationTypes.find(t => t.id === type)?.icon || '📝'
  }

  const getAnnotationColor = (type: AnnotationElement['annotationType']) => {
    return annotationTypes.find(t => t.id === type)?.color || '#ffeb3b'
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredComments = comments.filter(comment => 
    filterResolved ? true : !comment.resolved
  )

  const topLevelComments = filteredComments.filter(comment => !comment.parentId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Annotations & Comments</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Tools */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Tab Selection */}
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('annotations')}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    activeTab === 'annotations' 
                      ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  📝 Annotation Tools
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    activeTab === 'comments' 
                      ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  💬 Comments ({comments.length})
                </button>
              </div>

              {/* Annotation Tools */}
              {activeTab === 'annotations' && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Annotation Types</h3>
                  <div className="space-y-2">
                    {annotationTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedAnnotationType(type.id)}
                        className={`w-full p-3 text-left rounded-lg flex items-center space-x-3 transition-colors ${
                          selectedAnnotationType === type.id
                            ? 'bg-blue-100 text-blue-600 border border-blue-200'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-xl">{type.icon}</span>
                        <span className="text-sm font-medium">{type.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Stamp Options */}
                  {selectedAnnotationType === 'stamp' && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Stamp Types</h4>
                      {stampTypes.map((stamp) => (
                        <button
                          key={stamp.id}
                          className="w-full p-2 text-left rounded bg-white hover:bg-gray-50 text-xs flex items-center space-x-2"
                          style={{ color: stamp.color }}
                        >
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: stamp.color }}
                          />
                          <span>{stamp.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Click on the document to place annotations
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'annotations' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Document Annotations ({annotations.length})
                  </h3>
                  {annotations.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete all annotations?')) {
                          annotations.forEach(annotation => onDeleteAnnotation(annotation.id))
                        }
                      }}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {annotations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <p className="text-gray-500">No annotations yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Select an annotation type and click on the document to add annotations
                      </p>
                    </div>
                  ) : (
                    annotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="text-2xl">
                              {getAnnotationIcon(annotation.annotationType)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium text-gray-900 capitalize">
                                  {annotation.annotationType}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Page {annotation.pageNumber}
                                </span>
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: annotation.color }}
                                />
                              </div>
                              
                              {annotation.content && (
                                <p className="text-gray-700 text-sm mb-2">
                                  {annotation.content}
                                </p>
                              )}

                              <div className="text-xs text-gray-500">
                                By {annotation.author} • {formatDate(annotation.createdAt)}
                                {annotation.modifiedAt !== annotation.createdAt && (
                                  <span> • Modified {formatDate(annotation.modifiedAt)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onHighlightAnnotation(annotation.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              title="Show on document"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => onDeleteAnnotation(annotation.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Delete annotation"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Comments ({comments.length})
                  </h3>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filterResolved}
                        onChange={(e) => setFilterResolved(e.target.checked)}
                        className="mr-2"
                      />
                      Show resolved
                    </label>
                    {comments.some(c => !c.resolved) && (
                      <button
                        onClick={() => {
                          if (confirm('Mark all comments as resolved?')) {
                            comments.forEach(comment => {
                              if (!comment.resolved) {
                                onUpdateComment(comment.id, { resolved: true, modifiedAt: new Date() })
                              }
                            })
                          }
                        }}
                        className="px-3 py-1 text-sm text-green-600 border border-green-300 rounded hover:bg-green-50"
                      >
                        Resolve All
                      </button>
                    )}
                  </div>
                </div>

                {/* New Comment Input */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {currentUser.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newCommentContent}
                        onChange={(e) => setNewCommentContent(e.target.value)}
                        placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">
                          {replyingTo && (
                            <span>
                              Replying to comment • 
                              <button
                                onClick={() => setReplyingTo(null)}
                                className="ml-1 text-red-500 hover:text-red-700"
                              >
                                Cancel
                              </button>
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleCreateComment}
                          disabled={!newCommentContent.trim()}
                          className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {replyingTo ? 'Reply' : 'Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {topLevelComments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="text-gray-500">No comments yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Start a conversation about this document
                      </p>
                    </div>
                  ) : (
                    topLevelComments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`bg-white rounded-lg border p-4 ${
                          comment.resolved ? 'border-green-200 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex space-x-3">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {comment.author.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {comment.author}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(comment.createdAt)}
                              </span>
                              {comment.resolved && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Resolved
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-700 mb-3">
                              {comment.content}
                            </p>

                            <div className="flex items-center space-x-3 text-sm">
                              <button
                                onClick={() => setReplyingTo(comment.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Reply
                              </button>
                              
                              <button
                                onClick={() => handleResolveComment(comment.id, !comment.resolved)}
                                className={`${
                                  comment.resolved 
                                    ? 'text-orange-600 hover:text-orange-800' 
                                    : 'text-green-600 hover:text-green-800'
                                }`}
                              >
                                {comment.resolved ? 'Unresolve' : 'Resolve'}
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (confirm('Delete this comment?')) {
                                    onDeleteComment(comment.id)
                                  }
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-4 space-y-3 border-l-2 border-gray-200 pl-4">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex space-x-3">
                                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs">
                                      {reply.author.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-gray-900 text-sm">
                                          {reply.author}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatDate(reply.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-gray-700 text-sm">
                                        {reply.content}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnnotationPanel