#!/usr/bin/env python3
"""
AkShare 财务数据 MCP Server
提供上市公司财务数据查询工具
"""

import json
import sys
import akshare as ak
import pandas as pd
from datetime import datetime

def get_stock_info(stock_code: str) -> dict:
    """获取股票基本信息"""
    try:
        # A 股
        if stock_code.startswith('6') or stock_code.startswith('0') or stock_code.startswith('3'):
            stock_code = f"sh{stock_code}" if stock_code.startswith('6') else f"sz{stock_code}"
            info = ak.stock_info_a_code_name()
            stock_name = info[info['code'] == stock_code[2:]]['name'].values
            if len(stock_name) > 0:
                return {"name": stock_name[0], "code": stock_code[2:], "market": "A 股"}
        
        # 尝试获取实时行情
        try:
            if stock_code.startswith('sh') or stock_code.startswith('sz'):
                data = ak.stock_zh_a_spot_em()
            else:
                data = ak.stock_zh_a_spot_em()
            
            match = data[data['代码'] == stock_code] if '代码' in data.columns else data[data['code'] == stock_code]
            if len(match) > 0:
                return {
                    "name": match.iloc[0].get('名称', match.iloc[0].get('name', '未知')),
                    "code": stock_code,
                    "market": "A 股",
                    "price": float(match.iloc[0].get('最新价', match.iloc[0].get('price', 0))),
                    "change": float(match.iloc[0].get('涨跌幅', match.iloc[0].get('change', 0)))
                }
        except:
            pass
        
        return {"name": stock_code, "code": stock_code, "market": "未知"}
    except Exception as e:
        return {"error": str(e), "code": stock_code}

def get_financial_summary(stock_code: str) -> dict:
    """获取财务摘要（核心指标）"""
    try:
        # 获取财务指标
        if stock_code.startswith('sh') or stock_code.startswith('sz'):
            code = stock_code[2:]
        else:
            code = stock_code
        
        # 尝试获取主要财务指标
        try:
            data = ak.stock_financial_analysis_indicator(symbol=code)
            if len(data) > 0:
                latest = data.iloc[0] if isinstance(data, pd.DataFrame) else data
                return {
                    "roe": float(latest.get('净资产收益率', latest.get('roe', 0))),
                    "gross_margin": float(latest.get('销售毛利率', latest.get('gross_margin', 0))),
                    "debt_ratio": float(latest.get('资产负债率', latest.get('debt_ratio', 0))),
                    "revenue_growth": float(latest.get('营业收入增长率', latest.get('revenue_growth', 0))),
                    "profit_growth": float(latest.get('净利润增长率', latest.get('profit_growth', 0))),
                    "eps": float(latest.get('每股收益', latest.get('eps', 0))),
                    "pe_ratio": float(latest.get('市盈率', latest.get('pe_ratio', 0))),
                    "pb_ratio": float(latest.get('市净率', latest.get('pb_ratio', 0)))
                }
        except:
            pass
        
        return {"note": "详细财务数据获取失败，使用基础信息"}
    except Exception as e:
        return {"error": str(e)}

def get_business_overview(stock_code: str) -> dict:
    """获取业务概况"""
    try:
        # 尝试获取主营业务
        if stock_code.startswith('sh') or stock_code.startswith('sz'):
            code = stock_code[2:]
        else:
            code = stock_code
        
        try:
            # 获取公司资料
            data = ak.stock_info_a_code_name()
            return {
                "industry": "待获取",
                "main_business": "待获取",
                "employees": "待获取",
                "founded": "待获取"
            }
        except:
            pass
        
        return {"note": "业务概况数据获取中"}
    except Exception as e:
        return {"error": str(e)}

def get_risk_factors(stock_code: str) -> dict:
    """获取风险因素（基于财务指标推断）"""
    try:
        financials = get_financial_summary(stock_code)
        risks = []
        
        if "debt_ratio" in financials and financials.get("debt_ratio", 0) > 70:
            risks.append("资产负债率较高，存在偿债风险")
        if "revenue_growth" in financials and financials.get("revenue_growth", 0) < 0:
            risks.append("营业收入负增长，业务可能萎缩")
        if "profit_growth" in financials and financials.get("profit_growth", 0) < 0:
            risks.append("净利润负增长，盈利能力下降")
        if "roe" in financials and financials.get("roe", 0) < 5:
            risks.append("ROE 较低，股东回报率不高")
        
        if not risks:
            risks.append("暂无显著财务风险信号")
        
        return {"risks": risks}
    except Exception as e:
        return {"error": str(e)}

def generate_one_pager(stock_code: str) -> str:
    """生成 One Pager 结构化报告"""
    stock_info = get_stock_info(stock_code)
    business = get_business_overview(stock_code)
    financials = get_financial_summary(stock_code)
    risks = get_risk_factors(stock_code)
    
    report = f"""📊 **{stock_info.get('name', stock_code)} ({stock_info.get('code', stock_code)})**

**🏢 公司概况**
- 市场：{stock_info.get('market', 'N/A')}
- 行业：{business.get('industry', '待获取')}

**💰 核心财务指标**
- ROE: {financials.get('roe', 'N/A')}%
- 毛利率：{financials.get('gross_margin', 'N/A')}%
- 资产负债率：{financials.get('debt_ratio', 'N/A')}%
- 营收增长率：{financials.get('revenue_growth', 'N/A')}%
- 净利润增长率：{financials.get('profit_growth', 'N/A')}%
- 每股收益：{financials.get('eps', 'N/A')}
- 市盈率：{financials.get('pe_ratio', 'N/A')}

**✨ 亮点**
- 待补充（需进一步数据分析）

**⚠️ 风险**
"""
    for risk in risks.get('risks', ['暂无数据']):
        report += f"- {risk}\n"
    
    report += f"\n_数据更新时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}_"
    
    return report

# MCP 协议处理
def handle_request(request: dict) -> dict:
    """处理 MCP 请求"""
    method = request.get("method", "")
    params = request.get("params", {})
    
    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": request.get("id"),
            "result": {
                "tools": [
                    {
                        "name": "get_stock_info",
                        "description": "获取股票基本信息",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "stock_code": {"type": "string", "description": "股票代码"}
                            },
                            "required": ["stock_code"]
                        }
                    },
                    {
                        "name": "get_financial_summary",
                        "description": "获取财务摘要",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "stock_code": {"type": "string", "description": "股票代码"}
                            },
                            "required": ["stock_code"]
                        }
                    },
                    {
                        "name": "generate_one_pager",
                        "description": "生成 One Pager 财报报告",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "stock_code": {"type": "string", "description": "股票代码或公司名称"}
                            },
                            "required": ["stock_code"]
                        }
                    }
                ]
            }
        }
    
    elif method == "tools/call":
        tool_name = params.get("name", "")
        args = params.get("arguments", {})
        
        if tool_name == "get_stock_info":
            result = get_stock_info(args.get("stock_code", ""))
        elif tool_name == "get_financial_summary":
            result = get_financial_summary(args.get("stock_code", ""))
        elif tool_name == "generate_one_pager":
            result = {"report": generate_one_pager(args.get("stock_code", ""))}
        else:
            result = {"error": f"Unknown tool: {tool_name}"}
        
        return {
            "jsonrpc": "2.0",
            "id": request.get("id"),
            "result": {
                "content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}]
            }
        }
    
    elif method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": request.get("id"),
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "akshare-finance", "version": "1.0.0"}
            }
        }
    
    else:
        return {
            "jsonrpc": "2.0",
            "id": request.get("id"),
            "error": {"code": -32601, "message": f"Method not found: {method}"}
        }

def main():
    """主循环：读取 stdin，处理 MCP 请求，输出到 stdout"""
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            request = json.loads(line.strip())
            response = handle_request(request)
            print(json.dumps(response, ensure_ascii=False), flush=True)
        except json.JSONDecodeError:
            continue
        except Exception as e:
            error_response = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32603, "message": str(e)}
            }
            print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    main()
