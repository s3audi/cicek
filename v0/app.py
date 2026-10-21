import json
from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# JSON dosyasını okuma fonksiyonu
def load_projects():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# JSON dosyasına yazma fonksiyonu
def save_projects(projects):
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(projects, f, indent=4, ensure_ascii=False)

# Ana sayfa rotası
@app.route('/')
def home():
    projects = load_projects()
    return render_template('index.html', projects=projects)

# Admin paneli rotası
@app.route('/admin')
def admin():
    projects = load_projects()
    return render_template('admin.html', projects=projects)

# Proje ekleme veya düzenleme rotası
@app.route('/admin/add_or_edit_project', methods=['POST'])
def add_or_edit_project():
    projects = load_projects()
    project_id = request.form.get('id')
    title = request.form['title']
    description = request.form['description']
    completion_time = request.form['completion_time']
    image_url = request.form['image_url']

    if project_id: # Proje düzenleme
        project_id = int(project_id)
        for project in projects:
            if project['id'] == project_id:
                project['title'] = title
                project['description'] = description
                project['completion_time'] = completion_time
                project['image_url'] = image_url
                break
    else: # Yeni proje ekleme
        # Yeni ID bulma (mevcut en büyük ID'den bir fazlası)
        new_id = max([p['id'] for p in projects]) + 1 if projects else 1
        new_project = {
            'id': new_id,
            'title': title,
            'description': description,
            'completion_time': completion_time,
            'image_url': image_url
        }
        projects.append(new_project)

    save_projects(projects)
    return redirect(url_for('admin'))

# Proje silme rotası
@app.route('/admin/delete_project/<int:project_id>', methods=['POST'])
def delete_project(project_id):
    projects = load_projects()
    projects = [p for p in projects if p['id'] != project_id]
    save_projects(projects)
    return redirect(url_for('admin'))

if __name__ == '__main__':
    app.run(debug=True)