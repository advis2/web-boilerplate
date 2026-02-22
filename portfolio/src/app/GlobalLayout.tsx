"use client";

import React, { ReactNode, useState } from "react";
import styled from "styled-components";
import Link from "next/link";

// GlobalLayout 컴포넌트 정의
export const GlobalLayout: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <Container>
      {/* 상단 앱 바 */}
      <AppBar>
        <ToggleButton onClick={toggleSidebar}>☰</ToggleButton>
        <Title>My Portfolio</Title>
      </AppBar>

      {/* 메인 컨텐츠 영역 */}
      <MainContent>
        {/* 왼쪽 사이드바 */}
        {/* styled-components에서는 $로 시작하는 prop은 자동으로 DOM에 전달되지 않음. */}
        <Sidebar $isVisible={isSidebarVisible}>
          <SidebarContent>
            <SidebarItem href="/">Home</SidebarItem>
            <SidebarItem href="/about">About</SidebarItem>
            <SidebarItem href="/projects">Projects</SidebarItem>
            <SidebarItem href="/contact">Contact</SidebarItem>
          </SidebarContent>
        </Sidebar>

        {/* 페이지 내용 (내부 페이지 전환 내용) */}
        <Content>{children}</Content>
      </MainContent>

      {/* 하단 푸터 */}
      <Footer>© 2026 My Portfolio</Footer>
    </Container>
  );
};

export default GlobalLayout;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const AppBar = styled.header`
  background-color: #333;
  color: white;
  display: flex;
  align-items: center;
  padding: 10px 20px;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  margin-right: 20px;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
`;

const MainContent = styled.main`
  display: flex;
  flex: 1;
`;

// Sidebar 컴포넌트에 `isVisible`을 스타일링에만 사용
const Sidebar = styled.aside<{ $isVisible: boolean }>`
  background-color: #f4f4f4;
  width: ${(props) => (props.$isVisible ? "200px" : "0")};
  transition: width 0.3s ease;
  overflow: hidden;
  height: 100vh;

  @media (max-width: 768px) {
    width: ${(props) => (props.$isVisible ? "100%" : "0")};
  }
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

const SidebarItem = styled(Link)`
  text-decoration: none;
  color: #333;
  margin: 10px 0;
  font-size: 18px;
  &:hover {
    color: #0070f3;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;

const Footer = styled.footer`
  background-color: #333;
  color: white;
  text-align: center;
  padding: 10px;
`;
