import { User } from '../../domain'
export const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => (
  <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">{User.initials(name)}</span>
)
