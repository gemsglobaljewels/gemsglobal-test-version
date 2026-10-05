// Type declarations for Google's <model-viewer> web component
// This allows React/TypeScript to recognize it as a valid JSX element

declare namespace JSX {
    interface IntrinsicElements {
        'model-viewer': React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement> & {
                src?: string
                alt?: string
                ar?: boolean | string
                'ar-modes'?: string
                'camera-controls'?: boolean | string
                'auto-rotate'?: boolean | string
                poster?: string
                loading?: 'auto' | 'lazy' | 'eager'
                reveal?: 'auto' | 'interaction' | 'manual'
                'shadow-intensity'?: string
                'environment-image'?: string
                exposure?: string
                'camera-orbit'?: string
                'min-camera-orbit'?: string
                'max-camera-orbit'?: string
                'field-of-view'?: string
                'interaction-prompt'?: string
                'touch-action'?: string
            },
            HTMLElement
        >
    }
}
