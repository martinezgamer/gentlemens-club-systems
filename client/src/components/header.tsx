interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="mb-6 lg:mb-8">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && (
        <p className="text-gray-600 mt-2 text-sm lg:text-base">{subtitle}</p>
      )}
    </div>
  );
}