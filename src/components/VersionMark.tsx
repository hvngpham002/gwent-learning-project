interface VersionMarkProps {
    version: string
}

const VersionMark = ({ version }: VersionMarkProps) => {
    return (
    <div style={{
        position: 'fixed',
        bottom: '8px',
        right: '8px',
        fontSize: '15px',
        color: '#6b7280',
        zIndex: 50
    }}>
        v{version}
    </div>
    )
}

export default VersionMark;