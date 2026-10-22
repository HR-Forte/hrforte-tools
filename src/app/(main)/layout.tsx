import MainContainer from './_components/MainContainer';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return <MainContainer isPublic={false}>{children}</MainContainer>;
};

export default MainLayout;
