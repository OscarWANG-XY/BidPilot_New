export function CompanyProfile() {
    return <div>公司档案管理</div>
  }
  
// 子组件
CompanyProfile.BasicInfo = function BasicInfo() {
    return <div>基本信息</div>;
  };
  
  CompanyProfile.Qualifications = function Qualifications() {
    return <div>资质信息</div>;
  };
  
  CompanyProfile.Certificates = function Certificates() {
    return <div>证书信息</div>;
  };