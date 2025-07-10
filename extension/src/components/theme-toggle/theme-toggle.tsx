import { ActionIcon, Tooltip } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-preact';
import { useThemeColorScheme } from '../../themes';
import './theme-toggle.scss';

interface IThemeToggleProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'filled' | 'light' | 'outline' | 'transparent' | 'subtle';
  showTooltip?: boolean;
  className?: string;
}

export function ThemeToggle(props: IThemeToggleProps) {
  const { size = 'lg', variant = 'filled', showTooltip = true, className = '' } = props;
  const { colorScheme, toggleColorScheme } = useThemeColorScheme();
  const isDark = colorScheme === 'dark';

  const button = (
    <ActionIcon
      className={`theme-toggle ${className}`}
      variant={variant}
      color={isDark ? 'yellow' : 'indigo'}
      onClick={() => toggleColorScheme()}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      size={size}
      radius="xl"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <IconSun size={size === 'lg' ? 20 : 18} />
      ) : (
        <IconMoon size={size === 'lg' ? 20 : 18} />
      )}
    </ActionIcon>
  );

  if (showTooltip) {
    return (
      <Tooltip label={`Switch to ${isDark ? 'light' : 'dark'} mode`} withArrow>
        {button}
      </Tooltip>
    );
  }

  return button;
}
