// The Antville Project
// http://code.google.com/p/antville
//
// Copyright 2001–2014 by the Workers of Antville.
//
// Licensed under the Apache License, Version 2.0 (the ``License'');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an ``AS IS'' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Apply with enabled updater repository using `ant patch -Dpatch.id=20141214`

// Remove user relation from tag_hub
// The database user needs “alter” permission for the table to apply this patch.
// Afterwards user permissions should be restored.

var sql = new Sql();

sql.execute('alter table tag_hub drop column user_id');

sql.execute('update account set modified = created where modified is null');

sql.execute('update content set modified = created where modified is null');
sql.execute('update content set modifier_id = creator_id where modifier_id is null');

sql.execute('update file set modified = created where modified is null');
sql.execute('update file set modifier_id = creator_id where modifier_id is null');

sql.execute('update image set modified = created where modified is null');
sql.execute('update image set modifier_id = creator_id where modifier_id is null');

sql.execute('update layout set modified = created where modified is null');
sql.execute('update layout set modifier_id = creator_id where modifier_id is null');

sql.execute('update membership set modified = created where modified is null');
sql.execute('update membership set modifier_id = creator_id where modifier_id is null');

sql.execute('update poll set modified = created where modified is null');
sql.execute('update poll set modifier_id = creator_id where modifier_id is null');

sql.execute('update site set modified = created where modified is null');
sql.execute('update site set modifier_id = creator_id where modifier_id is null');

sql.execute('update skin set modified = created where modified is null');
sql.execute('update skin set modifier_id = creator_id where modifier_id is null');
