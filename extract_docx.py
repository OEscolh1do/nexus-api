import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text(docx_path):
    try:
        if not os.path.exists(docx_path):
            return f"Error: File not found at {docx_path}"
        with zipfile.ZipFile(docx_path, 'r') as zip_ref:
            if 'word/document.xml' not in zip_ref.namelist():
                return "Error: word/document.xml not found in docx"
            xml_content = zip_ref.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Namespace for Word XML
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            texts = []
            for paragraph in tree.findall('.//w:p', ns):
                paragraph_text = []
                # Handle text runs
                for run in paragraph.findall('.//w:r', ns):
                    for text in run.findall('.//w:t', ns):
                        if text.text:
                            paragraph_text.append(text.text)
                txt = "".join(paragraph_text).strip()
                if txt:
                    texts.append(txt)
            
            return "\n".join(texts)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    # Use full absolute path to the docx
    path = r"d:\Repositório_Pessoal\SaaS Projects\Neonorte\Neonorte\Plano de refatoração\Dimensionamento\Especificacao_Tecnica_Refatoracao_Kurupira.docx"
    print(extract_text(path))
