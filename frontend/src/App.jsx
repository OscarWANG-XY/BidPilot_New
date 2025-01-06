import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TenderBidManagement } from './pages/TenderBidManagement'
import { CompanyProfile } from './pages/CompanyProfile'
import { UserManagement } from './pages/UserManagement'
import './App.css'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* 招标文件路由, path是自定义的 */}
          <Route path="/tender-bid-management" element={<TenderBidManagement />}> 
            <Route path="list" element={<TenderBidManagement.List />} />
            <Route path="parse" element={<TenderBidManagement.Parser />} />
          </Route>

          {/* 公司档案路由 */}
          <Route path="/company" element={<CompanyProfile />}>
            <Route path="basic-info" element={<CompanyProfile.BasicInfo />} />
            <Route path="qualifications" element={<CompanyProfile.Qualifications />} />
            <Route path="certificates" element={<CompanyProfile.Certificates />} />
          </Route>

          {/* 用户管理路由 */}
          <Route path="/users" element={<UserManagement />}>
            <Route path="list" element={<UserManagement.List />} />
            <Route path="roles" element={<UserManagement.Roles />} />
          </Route>
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
