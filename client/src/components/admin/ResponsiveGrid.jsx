import React from 'react';
import { Grid, Box, Paper, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom responsive grid item that adjusts based on screen size
export const ResponsiveGridItem = ({ children, xs = 12, sm = 6, md = 4, lg = 3, xl = 2, ...props }) => {
  const theme = useTheme();
  const isLandscapeMobile = useMediaQuery('(orientation: landscape) and (max-height: 600px)');
  const isTV = useMediaQuery('(min-width: 1600px)');
  
  return (
    <Grid 
      item 
      xs={xs} 
      sm={sm} 
      md={md} 
      lg={lg} 
      xl={xl}
      sx={{
        // Override sizes in landscape mobile mode to show more columns
        ...(isLandscapeMobile && {
          width: {
            xs: '50%', // Force 2 columns in landscape mobile
            sm: '33.33%', // Force 3 columns in landscape mobile (larger screens)
          },
          maxWidth: {
            xs: '50%',
            sm: '33.33%',
          },
          flexBasis: {
            xs: '50%',
            sm: '33.33%',
          }
        }),
        // Override sizes in TV mode to show fewer but larger columns
        ...(isTV && {
          p: 2, // More padding on large screens
        }),
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Grid>
  );
};

// Styled card container for consistent items
export const ResponsiveCardContainer = styled(Paper)(({ theme }) => ({
  height: '100%',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
  },
  '@media (orientation: landscape) and (max-height: 600px)': {
    padding: theme.spacing(1.5),
    minHeight: '150px',
  },
  '@media (min-width: 1600px)': { // TV and large screens
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius * 1.5,
  }
}));

// Main responsive grid container with consistent spacing
export const ResponsiveGridContainer = ({ children, spacing = 3, ...props }) => {
  const theme = useTheme();
  const isLandscapeMobile = useMediaQuery('(orientation: landscape) and (max-height: 600px)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTV = useMediaQuery('(min-width: 1600px)');
  
  // Adjust spacing based on screen size
  let responsiveSpacing = spacing;
  if (isMobile) responsiveSpacing = 2;
  if (isLandscapeMobile) responsiveSpacing = 1;
  if (isTV) responsiveSpacing = 4;
  
  return (
    <Box sx={{ 
      width: '100%',
      overflowX: 'hidden', // Prevent horizontal scrolling
      '@media (min-width: 1600px)': { py: 2 }
    }}>
      <Grid 
        container 
        spacing={responsiveSpacing}
        sx={{
          '@media (orientation: landscape) and (max-height: 600px)': {
            flexWrap: 'nowrap',
            overflowX: 'auto',
            pb: 1, // Add padding for scrollbar
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: 4,
            },
          },
          ...props.sx
        }}
        {...props}
      >
        {children}
      </Grid>
    </Box>
  );
};

// Responsive form container with adaptive padding and width
export const ResponsiveFormContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
  },
  '@media (orientation: landscape) and (max-height: 600px)': {
    padding: theme.spacing(1),
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      minWidth: '50%',
      paddingRight: theme.spacing(1),
    }
  },
  '@media (min-width: 1600px)': { // TV and large screens
    maxWidth: '1200px',
    padding: theme.spacing(4),
  }
})); 